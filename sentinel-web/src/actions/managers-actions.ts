"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/actions/auth-actions";
import { createManagerSchema, type CreateManagerInput } from "@/lib/schemas";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// ============================================
// TYPES
// ============================================

export interface ManagerWithStats {
  id: string;
  sapId: string;
  fullName: string | null;
  role: UserRole;
  section: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    createdUsers: number;
  };
  cashLiability: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const managerIdSchema = z.string().uuid("Invalid manager ID");

// ============================================
// CACHE TAGS
// ============================================

const CACHE_TAGS = {
  managers: "managers",
  managerStats: "manager-stats",
} as const;

// ============================================
// GET ALL MANAGERS (CR/GR) - CACHED
// ============================================

const getCachedManagers = unstable_cache(
  async () => {
    // SECURITY FIX: Get dynamic ticket price instead of hardcoding
    const { getTicketPrice } = await import("@/actions/settings-actions");
    const ticketPrice = await getTicketPrice();

    const managers = await prisma.user.findMany({
      where: {
        role: {
          in: ["CR", "GR"],
        },
      },
      select: {
        id: true,
        sapId: true,
        fullName: true,
        role: true,
        section: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            createdUsers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate cash liability with dynamic price
    return managers.map((manager) => ({
      ...manager,
      cashLiability: manager._count.createdUsers * ticketPrice,
    }));
  },
  [CACHE_TAGS.managers],
  {
    tags: [CACHE_TAGS.managers],
    revalidate: 60, // Revalidate every 60 seconds as fallback
  }
);

export async function getManagers(): Promise<ManagerWithStats[]> {
  await requireSuperAdmin();
  return getCachedManagers();
}

// ============================================
// GET MANAGER BY ID (for detail view)
// ============================================

export interface ManagerDetail {
  id: string;
  sapId: string;
  fullName: string | null;
  role: UserRole;
  section: string | null;
  semester: string | null;
  gender: string | null;
  isActive: boolean;
  createdAt: Date;
  studentsCount: number;
  cashCollected: number;
}

export async function getManagerById(
  managerId: string
): Promise<ManagerDetail | null> {
  await requireSuperAdmin();

  const validation = managerIdSchema.safeParse(managerId);
  if (!validation.success) return null;

  const manager = await prisma.user.findUnique({
    where: { id: managerId, role: { in: ["CR", "GR"] } },
    select: {
      id: true,
      sapId: true,
      fullName: true,
      role: true,
      section: true,
      semester: true,
      gender: true,
      isActive: true,
      createdAt: true,
      _count: { select: { createdUsers: true } },
    },
  });

  if (!manager) return null;

  // Use dynamic ticket price
  const { getTicketPrice } = await import("@/actions/settings-actions");
  const ticketPrice = await getTicketPrice();

  return {
    ...manager,
    studentsCount: manager._count.createdUsers,
    cashCollected: manager._count.createdUsers * ticketPrice,
  };
}

// ============================================
// GET MANAGER STATS (for detail view)
// ============================================

export interface ManagerStats {
  studentsRegistered: number;
  cashCollected: number;
  recentStudents: {
    id: string;
    sapId: string;
    fullName: string | null;
    createdAt: Date;
  }[];
  auditLogs: {
    id: string;
    action: string;
    details: string | null;
    timestamp: Date;
  }[];
}

export async function getManagerStats(
  managerId: string
): Promise<ManagerStats | null> {
  await requireSuperAdmin();

  const validation = managerIdSchema.safeParse(managerId);
  if (!validation.success) return null;

  const [students, auditLogs] = await Promise.all([
    prisma.user.findMany({
      where: { createdById: managerId, role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        sapId: true,
        fullName: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: { performerId: managerId },
      orderBy: { timestamp: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        details: true,
        timestamp: true,
      },
    }),
  ]);

  // Use dynamic ticket price
  const { getTicketPrice } = await import("@/actions/settings-actions");
  const ticketPrice = await getTicketPrice();

  return {
    studentsRegistered: students.length,
    cashCollected: students.length * ticketPrice,
    recentStudents: students,
    auditLogs,
  };
}

// ============================================
// UPDATE MANAGER
// ============================================

const updateManagerSchema = z.object({
  fullName: z.string().min(2, "Name too short").optional(),
  section: z.string().optional(),
  semester: z.string().optional(),
});

export async function updateManager(
  managerId: string,
  data: z.infer<typeof updateManagerSchema>
): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin();

    const idValidation = managerIdSchema.safeParse(managerId);
    if (!idValidation.success) {
      return { success: false, message: "Invalid manager ID" };
    }

    const dataValidation = updateManagerSchema.safeParse(data);
    if (!dataValidation.success) {
      return {
        success: false,
        message: dataValidation.error.issues[0].message,
      };
    }

    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { role: true, fullName: true, sapId: true },
    });

    if (!manager || !["CR", "GR"].includes(manager.role)) {
      return { success: false, message: "Manager not found" };
    }

    await prisma.user.update({
      where: { id: managerId },
      data: dataValidation.data,
    });

    await prisma.auditLog.create({
      data: {
        performerId: admin.id,
        action: "UPDATE_MANAGER",
        targetId: managerId,
        details: `Updated ${manager.role}: ${
          manager.fullName || manager.sapId
        }`,
      },
    });

    revalidatePath(`/admin/managers/${managerId}`);
    revalidatePath("/admin/managers");
    revalidateTag(CACHE_TAGS.managers, "max");

    return { success: true, message: "Manager updated successfully" };
  } catch (error) {
    console.error("Update Manager Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update manager",
    };
  }
}

// ============================================
// CREATE MANAGER (CR/GR)
// ============================================

export async function createManager(
  input: CreateManagerInput
): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin();

    // Validate input with Zod
    const validation = createManagerSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const { email, password, fullName, semester, section, role, gender } =
      validation.data;

    // Generate SAP ID for manager (SemesterSection-Role format, e.g. 8A-CR)
    const sapId = `${semester}${section}-${role}`;

    // Check if SAP ID already exists in Prisma
    const existingUser = await prisma.user.findUnique({
      where: { sapId },
    });

    if (existingUser) {
      return {
        success: false,
        message: `A ${role} for class ${semester}${section} already exists`,
      };
    }

    const supabaseAdmin = createAdminClient();
    let userId: string;

    // 1. Try to create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: role,
        },
      });

    if (authError) {
      // Handle "Email already registered" specifically
      if (
        authError.message.includes(
          "email address has already been registered"
        ) ||
        authError.code === "email_exists"
      ) {
        // Orphan record found - email exists in Auth but not in Prisma
        // SECURITY FIX: Use paginated search instead of unbounded listUsers()
        let orphanUser = null;
        let page = 1;
        const perPage = 50;

        // Search with reasonable limit (max 500 users checked)
        while (page <= 10 && !orphanUser) {
          const { data: userPage } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage,
          });

          if (!userPage?.users?.length) break;

          orphanUser = userPage.users.find((u) => u.email === email);
          page++;
        }

        if (!orphanUser) {
          return {
            success: false,
            message: "Email conflict detected. Please contact support.",
          };
        }

        // Check if this user exists in Prisma
        const prismaUser = await prisma.user.findUnique({
          where: { id: orphanUser.id },
        });

        if (prismaUser) {
          return {
            success: false,
            message: "A manager with this email already exists in the system.",
          };
        }

        // If we get here, it's an orphan (exists in Auth, not in Prisma)
        // We can proceed to use this ID
        userId = orphanUser.id;

        // Optional: Update the password if provided, since we're "reclaiming" the account
        if (password) {
          await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        }
      } else {
        console.error("Supabase Auth Error:", authError);
        return {
          success: false,
          message: authError.message,
        };
      }
    } else {
      userId = authData.user.id;
    }

    // 2. Create user record in Prisma
    await prisma.user.create({
      data: {
        id: userId, // Link to Supabase Auth ID
        sapId,
        fullName,
        role: role as UserRole,
        semester,
        section,
        gender: gender as "MALE" | "FEMALE",
        createdById: admin.id,
        isActive: true,
        isPaid: true, // Managers don't need payment
        profileCompleted: true,
      },
    });

    // 3. Log the action
    await prisma.auditLog.create({
      data: {
        performerId: admin.id,
        action: "CREATE_MANAGER",
        targetId: userId,
        details: `Created ${role} for class ${semester}${section}: ${fullName}`,
      },
    });

    revalidatePath("/admin/managers");
    revalidateTag(CACHE_TAGS.managers, "max");

    return {
      success: true,
      message: `${role} "${fullName}" created successfully for class ${semester}${section}.`,
    };
  } catch (error) {
    console.error("Create Manager Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create manager",
    };
  }
}

// ============================================
// TOGGLE MANAGER ACTIVE STATUS (Freeze/Unfreeze)
// ============================================

export async function toggleManagerActive(
  managerId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin();

    // Verify target is a manager
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { role: true, fullName: true, sapId: true },
    });

    if (!manager || !["CR", "GR"].includes(manager.role)) {
      return {
        success: false,
        message: "Manager not found",
      };
    }

    // Update status
    await prisma.user.update({
      where: { id: managerId },
      data: { isActive },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        performerId: admin.id,
        action: isActive ? "UNFREEZE_MANAGER" : "FREEZE_MANAGER",
        targetId: managerId,
        details: `${isActive ? "Unfroze" : "Froze"} ${manager.role} account: ${
          manager.fullName || manager.sapId
        }`,
      },
    });

    revalidatePath("/admin/managers");
    revalidateTag(CACHE_TAGS.managers, "max");

    return {
      success: true,
      message: `Manager ${isActive ? "activated" : "frozen"} successfully`,
    };
  } catch (error) {
    console.error("Toggle Manager Active Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update manager",
    };
  }
}

// ============================================
// DELETE MANAGER
// ============================================

export async function deleteManager(managerId: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin();

    // Verify target is a manager and get their info
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: {
        role: true,
        fullName: true,
        sapId: true,
        _count: { select: { createdUsers: true } },
      },
    });

    if (!manager || !["CR", "GR"].includes(manager.role)) {
      return {
        success: false,
        message: "Manager not found",
      };
    }

    // Prevent deletion if they have created users (financial liability)
    if (manager._count.createdUsers > 0) {
      return {
        success: false,
        message: `Cannot delete ${manager.role} with ${manager._count.createdUsers} registered students. Transfer responsibility first.`,
      };
    }

    // Delete from Supabase Auth
    const supabaseAdmin = createAdminClient();
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      managerId
    );

    if (authError) {
      console.error("Supabase Auth Delete Error:", authError);
      // Continue with Prisma deletion even if Auth fails
    }

    // Delete from Prisma
    await prisma.user.delete({
      where: { id: managerId },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        performerId: admin.id,
        action: "DELETE_MANAGER",
        targetId: managerId,
        details: `Deleted ${manager.role} account: ${
          manager.fullName || manager.sapId
        }`,
      },
    });

    revalidatePath("/admin/managers");
    revalidateTag(CACHE_TAGS.managers, "max");

    return {
      success: true,
      message: `Manager deleted successfully`,
    };
  } catch (error) {
    console.error("Delete Manager Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete manager",
    };
  }
}
