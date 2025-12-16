"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export interface CreateGuardResult {
  success: boolean;
  message: string;
  guardId?: string;
}

export interface GuardListItem {
  id: string;
  fullName: string | null;
  email: string;
  createdAt: string;
  isActive: boolean;
}

export interface GuardStats {
  total: number;
  active: number;
  inactive: number;
  totalScans: number;
  topPerformer: string | null;
}

export interface GuardActivity {
  id: string;
  type: "ENTRY" | "EXIT";
  status: "GRANTED" | "REJECTED" | "DUPLICATE";
  timestamp: string;
  guardName: string;
  guardEmail: string;
  studentName: string;
  studentSapId: string;
}

// ============================================
// HELPERS
// ============================================

async function getAdminId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, isActive: true },
  });

  if (!dbUser || dbUser.role !== "SUPER_ADMIN" || !dbUser.isActive) {
    throw new Error("Unauthorized");
  }

  return dbUser.id;
}

// ============================================
// ACTIONS
// ============================================

/**
 * Create a new guard account with email/password authentication
 */
export async function createGuard(
  fullName: string,
  email: string,
  password: string
): Promise<CreateGuardResult> {
  try {
    // Verify admin authorization
    await getAdminId();

    // Validate inputs
    if (!fullName || fullName.trim().length < 3) {
      return {
        success: false,
        message: "Full name must be at least 3 characters",
      };
    }

    if (!email || !email.includes("@")) {
      return { success: false, message: "Invalid email address" };
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters",
      };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return { success: false, message: "Email already exists" };
    }

    // Create admin client for Supabase Auth
    const supabaseAdmin = createAdminClient();

    // Create user in Supabase Auth using Admin API
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: fullName,
          role: "GUARD",
        },
      });

    if (authError || !authUser.user) {
      console.error("Supabase Auth Error:", authError);
      return {
        success: false,
        message: authError?.message || "Failed to create auth user",
      };
    }

    // Create user in database with GUARD role
    await prisma.user.create({
      data: {
        id: authUser.user.id,
        email: email.toLowerCase(),
        fullName: fullName,
        sapId: authUser.user.id.substring(0, 8).toUpperCase(), // Generate unique SAP-like ID
        role: "GUARD",
        isActive: true,
        isPaid: false,
        profileCompleted: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        performerId: await getAdminId(),
        action: "CREATE_GUARD",
        targetId: authUser.user.id,
        details: `Created guard account for ${fullName} (${email})`,
      },
    });

    revalidatePath("/admin/guards");

    return {
      success: true,
      message: `Guard account created successfully for ${fullName}`,
      guardId: authUser.user.id,
    };
  } catch (error) {
    console.error("Create Guard Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create guard account",
    };
  }
}

/**
 * Get all guard accounts
 */
export async function getAllGuards(): Promise<GuardListItem[]> {
  try {
    await getAdminId();

    const guards = await prisma.user.findMany({
      where: { role: "GUARD" },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return guards.map((guard) => ({
      id: guard.id,
      fullName: guard.fullName,
      email: guard.email || "",
      createdAt: guard.createdAt.toISOString(),
      isActive: guard.isActive,
    }));
  } catch (error) {
    console.error("Get Guards Error:", error);
    return [];
  }
}

/**
 * Delete a guard account
 */
export async function deleteGuard(guardId: string): Promise<CreateGuardResult> {
  try {
    const adminId = await getAdminId();

    // Verify guard exists
    const guard = await prisma.user.findUnique({
      where: { id: guardId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    if (!guard) {
      return { success: false, message: "Guard not found" };
    }

    if (guard.role !== "GUARD") {
      return { success: false, message: "User is not a guard" };
    }

    const supabaseAdmin = createAdminClient();

    // HIGH-1 FIX: Delete Auth FIRST to prevent orphans
    // If Auth delete fails, abort. If Prisma delete fails, Auth is already gone (acceptable).
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      guardId
    );

    if (authError) {
      console.error("Failed to delete from Supabase Auth:", authError);
      return {
        success: false,
        message: "Failed to delete authentication record. Please try again.",
      };
    }

    // Log the action BEFORE deleting from Prisma
    await prisma.auditLog.create({
      data: {
        performerId: adminId,
        action: "DELETE_GUARD",
        targetId: guardId,
        details: `Deleted guard account for ${guard.fullName} (${guard.email})`,
      },
    });

    // Delete related access logs (guards may have scanned students)
    await prisma.accessLog.deleteMany({
      where: { scannerId: guardId },
    });

    // Delete audit logs where this guard was the performer
    await prisma.auditLog.deleteMany({
      where: { performerId: guardId },
    });

    // Delete from database
    await prisma.user.delete({
      where: { id: guardId },
    });

    revalidatePath("/admin/guards");

    return {
      success: true,
      message: `Guard account deleted successfully`,
    };
  } catch (error) {
    console.error("Delete Guard Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete guard account",
    };
  }
}

/**
 * Toggle guard active status
 */
export async function toggleGuardStatus(
  guardId: string
): Promise<CreateGuardResult> {
  try {
    await getAdminId();

    const guard = await prisma.user.findUnique({
      where: { id: guardId },
      select: { id: true, fullName: true, role: true, isActive: true },
    });

    if (!guard) {
      return { success: false, message: "Guard not found" };
    }

    if (guard.role !== "GUARD") {
      return { success: false, message: "User is not a guard" };
    }

    await prisma.user.update({
      where: { id: guardId },
      data: { isActive: !guard.isActive },
    });

    revalidatePath("/admin/guards");

    return {
      success: true,
      message: `Guard ${
        guard.isActive ? "deactivated" : "activated"
      } successfully`,
    };
  } catch (error) {
    console.error("Toggle Guard Status Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update guard status",
    };
  }
}

/**
 * Get guard statistics
 */
export async function getGuardStats(): Promise<GuardStats> {
  try {
    await getAdminId();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalScans, activeCount, inactiveCount, topPerformerData] =
      await Promise.all([
        prisma.accessLog.count({
          where: {
            scannerId: { not: null },
            timestamp: { gte: todayStart },
          },
        }),
        prisma.user.count({
          where: { role: "GUARD", isActive: true },
        }),
        prisma.user.count({
          where: { role: "GUARD", isActive: false },
        }),
        // Get top performer
        prisma.accessLog.groupBy({
          by: ["scannerId"],
          where: {
            scannerId: { not: null },
            timestamp: { gte: todayStart },
          },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 1,
        }),
      ]);

    let topPerformer: string | null = null;
    if (topPerformerData.length > 0 && topPerformerData[0].scannerId) {
      const guard = await prisma.user.findUnique({
        where: { id: topPerformerData[0].scannerId },
        select: { fullName: true },
      });
      topPerformer = guard?.fullName || null;
    }

    return {
      total: activeCount + inactiveCount,
      active: activeCount,
      inactive: inactiveCount,
      totalScans,
      topPerformer,
    };
  } catch (error) {
    console.error("Get Guard Stats Error:", error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      totalScans: 0,
      topPerformer: null,
    };
  }
}

/**
 * Get recent guard activity
 */
export async function getGuardActivity(
  limit: number = 50
): Promise<GuardActivity[]> {
  try {
    await getAdminId();

    const recentScans = await prisma.accessLog.findMany({
      where: {
        scannerId: { not: null },
      },
      take: limit,
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        timestamp: true,
        scanner: {
          select: {
            fullName: true,
            email: true,
          },
        },
        user: {
          select: {
            fullName: true,
            sapId: true,
          },
        },
      },
    });

    return recentScans.map((scan) => ({
      id: scan.id,
      type: scan.type,
      status: scan.status,
      timestamp: scan.timestamp.toISOString(),
      guardName: scan.scanner?.fullName || "Unknown",
      guardEmail: scan.scanner?.email || "",
      studentName: scan.user.fullName || "Unknown",
      studentSapId: scan.user.sapId,
    }));
  } catch (error) {
    console.error("Get Guard Activity Error:", error);
    return [];
  }
}
