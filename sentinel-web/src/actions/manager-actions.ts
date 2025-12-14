"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath, unstable_cache } from "next/cache";
import { randomBytes } from "crypto";
import { getTicketPrice } from "@/actions/settings-actions";
import type { User } from "@supabase/supabase-js";

// ============================================
// TYPES
// ============================================

export interface ManagerStats {
  cashCollected: number;
  totalPasses: number;
}

export interface LedgerEntry {
  id: string;
  sapId: string;
  fullName: string | null;
  createdAt: string;
  activationToken: string | null;
}

export interface IssuePassResult {
  success: boolean;
  message: string;
  token?: string;
  studentName?: string;
}

// ============================================
// HELPERS
// ============================================

async function getManagerId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, isActive: true },
  });

  if (
    !dbUser ||
    !dbUser.isActive ||
    (dbUser.role !== "CR" && dbUser.role !== "GR")
  ) {
    throw new Error("Unauthorized Manager Access");
  }

  return dbUser.id;
}

function generateToken(): string {
  // Generate a 6-character alphanumeric token (uppercase)
  // Avoiding ambiguous characters like I, l, 1, O, 0
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  const randomValues = randomBytes(6);

  for (let i = 0; i < 6; i++) {
    token += chars[randomValues[i] % chars.length];
  }

  return token;
}

// ============================================
// ACTIONS
// ============================================

export const getManagerStats = async () => {
  const managerId = await getManagerId();

  return unstable_cache(
    async () => {
      const ticketPrice = await getTicketPrice();
      const count = await prisma.user.count({
        where: {
          createdById: managerId,
          role: "STUDENT",
        },
      });

      return {
        cashCollected: count * ticketPrice,
        totalPasses: count,
      };
    },
    [`manager-stats-${managerId}`],
    { tags: [`manager-stats-${managerId}`], revalidate: 60 } // Cache for 1 minute
  )();
};

export interface ManagerSummary {
  manager: {
    fullName: string | null;
    section: string | null;
    semester: string | null;
  };
  stats: {
    cashCollected: number;
    totalPasses: number;
    ticketPrice: number;
  };
  students: {
    id: string;
    fullName: string | null;
    sapId: string;
    createdAt: string;
  }[];
}

export const getManagerSummary = async (): Promise<ManagerSummary> => {
  const managerId = await getManagerId();

  const [manager, ticketPrice, students] = await Promise.all([
    prisma.user.findUnique({
      where: { id: managerId },
      select: { fullName: true, section: true, semester: true },
    }),
    getTicketPrice(),
    prisma.user.findMany({
      where: {
        createdById: managerId,
        role: "STUDENT",
      },
      select: {
        id: true,
        fullName: true,
        sapId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    manager: manager || { fullName: null, section: null, semester: null },
    stats: {
      cashCollected: students.length * ticketPrice,
      totalPasses: students.length,
      ticketPrice,
    },
    students: students.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    })),
  };
};

export const getManagerLedger = async (
  page: number = 1,
  limit: number = 10
): Promise<{ data: LedgerEntry[]; total: number; totalPages: number }> => {
  const managerId = await getManagerId();
  const skip = (page - 1) * limit;

  return unstable_cache(
    async () => {
      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where: {
            createdById: managerId,
            role: "STUDENT",
          },
          select: {
            id: true,
            sapId: true,
            fullName: true,
            activationToken: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: skip,
        }),
        prisma.user.count({
          where: {
            createdById: managerId,
            role: "STUDENT",
          },
        }),
      ]);

      return {
        data: data.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
        })),
        total,
        totalPages: Math.ceil(total / limit),
      };
    },
    [`manager-ledger-${managerId}-${page}`],
    { tags: [`manager-ledger-${managerId}`], revalidate: 30 } // Cache for 30 seconds
  )();
};

export async function issuePass(
  sapId: string,
  fullName: string
): Promise<IssuePassResult> {
  try {
    const managerId = await getManagerId();

    // ============================================
    // INPUT VALIDATION (HARDENED)
    // ============================================
    if (!sapId || !/^\d{6,10}$/.test(sapId)) {
      return {
        success: false,
        message: "Invalid SAP ID format (must be 6-10 digits)",
      };
    }

    const sanitizedName = fullName
      .trim()
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/[<>"'`]/g, "") // Remove dangerous chars
      .slice(0, 100); // Max length

    if (sanitizedName.length < 3) {
      return {
        success: false,
        message: "Full name is required (min 3 characters)",
      };
    }

    // ============================================
    // RATE LIMITING: Max 10 passes per minute
    // ============================================
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentPasses = await prisma.user.count({
      where: {
        createdById: managerId,
        createdAt: { gt: oneMinuteAgo },
      },
    });

    if (recentPasses >= 10) {
      return {
        success: false,
        message: "Rate limit exceeded. Please wait a moment.",
      };
    }

    // ============================================
    // PRE-FLIGHT CHECK: Does student already exist in DB?
    // ============================================
    const existingStudent = await prisma.user.findUnique({
      where: { sapId },
      select: { id: true, createdBy: { select: { fullName: true } } },
    });

    if (existingStudent) {
      const creatorName = existingStudent.createdBy?.fullName || "System";
      return {
        success: false,
        message: `Student already registered by ${creatorName}`,
      };
    }

    // Get manager's section and semester to inherit
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { section: true, semester: true },
    });

    // ============================================
    // GENERATE CREDENTIALS
    // ============================================
    const token = generateToken();
    const email = `${sapId}@sentinel.edu`;

    // ============================================
    // SUPABASE AUTH: Create or reclaim user
    // CRITICAL FIX: No more unbounded listUsers() - use create with conflict handling
    // ============================================
    const supabaseAdmin = createAdminClient();
    let authUserId: string;
    let wasNewAuthUser = false;

    // Try to create new user first
    const { data: createResult, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: token,
        email_confirm: true,
        user_metadata: { sapId, role: "STUDENT" },
      });

    if (createError) {
      // Handle "email already registered" - reclaim the orphan user
      if (
        createError.message?.includes("already been registered") ||
        createError.code === "email_exists"
      ) {
        // CRITICAL FIX: Use paginated listUsers with filter instead of fetching all
        // Note: Supabase Admin API doesn't support email filter directly in listUsers
        // Best approach: try to get user by creating then handling conflict
        // Alternative: Use Supabase getUserById if we stored the ID, but we don't have it here

        // Since we can't query by email directly, we need to handle this edge case
        // This should be rare (orphan auth users without DB records)
        // For now, use limited pagination as a fallback
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
          console.error("Email conflict but user not found in first 500 users");
          return {
            success: false,
            message: "Registration conflict. Please contact admin.",
          };
        }

        // Check if this orphan has a Prisma record
        const prismaRecord = await prisma.user.findUnique({
          where: { id: orphanUser.id },
        });

        if (prismaRecord) {
          return {
            success: false,
            message: "User already exists in the system.",
          };
        }

        // Reclaim orphan: update password
        const { error: updateError } =
          await supabaseAdmin.auth.admin.updateUserById(orphanUser.id, {
            password: token,
            user_metadata: { sapId, role: "STUDENT" },
          });

        if (updateError) {
          console.error("Failed to reclaim orphan auth user:", updateError);
          return {
            success: false,
            message: "Failed to update authentication. Contact admin.",
          };
        }

        authUserId = orphanUser.id;
        wasNewAuthUser = false;
      } else {
        console.error("Supabase Auth Error:", createError);
        return {
          success: false,
          message: "Failed to create authentication record.",
        };
      }
    } else {
      if (!createResult?.user) {
        return {
          success: false,
          message: "Authentication creation returned no user.",
        };
      }
      authUserId = createResult.user.id;
      wasNewAuthUser = true;
    }

    // ============================================
    // DATABASE INSERT with explicit rollback on failure
    // CRITICAL FIX: Proper rollback of Supabase auth user
    // ============================================
    try {
      await prisma.user.create({
        data: {
          id: authUserId,
          sapId,
          fullName: sanitizedName,
          role: "STUDENT",
          isPaid: true,
          isActive: true,
          createdById: managerId,
          activationToken: token,
          section: manager?.section || null,
          semester: manager?.semester || null,
        },
      });
    } catch (dbError) {
      // CRITICAL FIX: Rollback Supabase auth user if we just created it
      if (wasNewAuthUser) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
          console.log(
            "Successfully rolled back Supabase auth user:",
            authUserId
          );
        } catch (rollbackError) {
          console.error(
            "ALERT: Failed to rollback auth user - orphan created:",
            authUserId,
            rollbackError
          );
        }
      }

      console.error("Database insert failed:", dbError);

      // Check for unique constraint violation (concurrent registration)
      if (
        dbError instanceof Error &&
        dbError.message.includes("Unique constraint")
      ) {
        return {
          success: false,
          message: "Student already exists (concurrent registration detected).",
        };
      }

      return {
        success: false,
        message: "Failed to create student record. Please try again.",
      };
    }

    // ============================================
    // SUCCESS: Revalidate caches
    // ============================================
    revalidatePath("/manager/dashboard");

    return {
      success: true,
      message: "Pass issued successfully",
      token: token,
      studentName: sanitizedName,
    };
  } catch (error) {
    console.error("Issue Pass Error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Delete a student account.
 * SECURITY: Only the manager who created the student can delete them.
 */
export async function deleteStudent(
  studentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const managerId = await getManagerId();

    if (!studentId) {
      return { success: false, message: "Student ID is required" };
    }

    // Verify student exists and was created by this manager
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        sapId: true,
        fullName: true,
        createdById: true,
        role: true,
      },
    });

    if (!student) {
      return { success: false, message: "Student not found" };
    }

    if (student.role !== "STUDENT") {
      return { success: false, message: "User is not a student" };
    }

    if (student.createdById !== managerId) {
      return {
        success: false,
        message: "You can only delete students you created",
      };
    }

    // Delete from Supabase Auth
    const supabaseAdmin = createAdminClient();

    // Log the action BEFORE deleting (so we have record of who deleted)
    await prisma.auditLog.create({
      data: {
        performerId: managerId,
        action: "DELETE_STUDENT",
        targetId: studentId,
        details: `Deleted student ${student.sapId} (${
          student.fullName || "Unknown"
        })`,
      },
    });

    // Delete related records first to avoid foreign key constraints
    // 1. Delete access logs where this user was scanned
    await prisma.accessLog.deleteMany({
      where: { userId: studentId },
    });

    // 2. Delete audit logs where this user was the performer (if any)
    await prisma.auditLog.deleteMany({
      where: { performerId: studentId },
    });

    // 3. Now delete the user from Prisma
    await prisma.user.delete({
      where: { id: studentId },
    });

    // 4. Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      studentId
    );

    if (authError) {
      console.error("Failed to delete from Supabase Auth:", authError);
      // Don't return error since Prisma deletion succeeded
    }

    revalidatePath("/manager/dashboard");

    return {
      success: true,
      message: `Student ${student.sapId} deleted successfully`,
    };
  } catch (error) {
    console.error("Delete Student Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete student",
    };
  }
}
