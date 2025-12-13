"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CreateUserInput {
  fullName: string;
  sapId: string; // 8-digit SAP ID
  email: string;
  section?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  isPaid?: boolean;
}

export interface CreateUserResult {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Server Action: Create a new STUDENT user
 * SECURED: Requires SUPER_ADMIN authentication via Prisma
 *
 * Flow:
 * 1. Verify SUPER_ADMIN role
 * 2. Validate input
 * 3. Create user in Supabase Auth (Admin API)
 * 4. Create user record in Prisma
 * 5. Log the action
 */
export async function createUser(
  input: CreateUserInput
): Promise<CreateUserResult> {
  try {
    // ============================================
    // AUTHORIZATION CHECK - Require SUPER_ADMIN
    // ============================================
    const admin = await requireSuperAdmin();

    // ============================================
    // INPUT VALIDATION
    // ============================================
    if (!input.fullName || input.fullName.trim().length < 2) {
      return {
        success: false,
        message: "Full name is required (min 2 characters)",
      };
    }

    if (!input.sapId || !/^[0-9]{8}$/.test(input.sapId.trim())) {
      return {
        success: false,
        message: "SAP ID must be exactly 8 digits",
      };
    }

    if (!input.email || !EMAIL_REGEX.test(input.email)) {
      return { success: false, message: "Valid email is required" };
    }

    // ============================================
    // CHECK FOR DUPLICATE SAP ID
    // ============================================
    const existingUser = await prisma.user.findUnique({
      where: { sapId: input.sapId.trim() },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        message: `SAP ID ${input.sapId} already exists`,
      };
    }

    // ============================================
    // STEP A: Create user in Supabase Auth
    // ============================================
    const tempPassword = `SENTINEL_${input.sapId}_${Date.now()}`;

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: input.email.trim(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: input.fullName.trim(),
          sap_id: input.sapId.trim(),
        },
      });

    if (authError || !authData.user) {
      console.error("Supabase Auth Error:", authError);
      return {
        success: false,
        message: authError?.message || "Failed to create auth user",
      };
    }

    // ============================================
    // STEP B: Create user record in Prisma
    // ============================================
    try {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          sapId: input.sapId.trim(),
          fullName: input.fullName.trim(),
          role: "STUDENT",
          section: input.section?.trim() || null,
          gender: input.gender || null,
          isPaid: input.isPaid ?? false,
          isActive: true,
          createdById: admin.id,
        },
      });
    } catch (prismaError) {
      // Rollback: Delete the Supabase auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error("Prisma Create Error:", prismaError);
      return {
        success: false,
        message: "Failed to create user record",
      };
    }

    // ============================================
    // STEP C: Log the action
    // ============================================
    await prisma.auditLog.create({
      data: {
        action: "USER_CREATED",
        adminId: admin.id,
        targetId: authData.user.id,
        details: `Created student ${input.fullName} (${input.sapId})`,
      },
    });

    // Revalidate the students page
    revalidatePath("/admin/students");

    return {
      success: true,
      message: `Student "${input.fullName}" created successfully`,
      userId: authData.user.id,
    };
  } catch (error) {
    console.error("Error creating user:", error);

    // Handle authorization errors gracefully
    if (error instanceof Error && error.message.includes("required")) {
      return { success: false, message: error.message };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

/**
 * Server Action: Update user payment status
 * SECURED: Requires SUPER_ADMIN authentication
 */
export async function updatePaymentStatus(
  userId: string,
  paymentStatus: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    // ============================================
    // AUTHORIZATION CHECK
    // ============================================
    const admin = await requireSuperAdmin();

    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    // Update in Prisma
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isPaid: paymentStatus },
      select: { fullName: true, sapId: true },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: paymentStatus ? "PAYMENT_MARKED_PAID" : "PAYMENT_MARKED_UNPAID",
        adminId: admin.id,
        targetId: userId,
        details: `Payment status updated for ${updatedUser.fullName} (${updatedUser.sapId})`,
      },
    });

    revalidatePath("/admin/students");

    return {
      success: true,
      message: `Payment status updated successfully`,
    };
  } catch (error) {
    console.error("Error updating payment status:", error);

    if (error instanceof Error && error.message.includes("required")) {
      return { success: false, message: error.message };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update payment status",
    };
  }
}

/**
 * Server Action: Delete a user
 * SECURED: Requires SUPER_ADMIN authentication
 */
export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // ============================================
    // AUTHORIZATION CHECK
    // ============================================
    const admin = await requireSuperAdmin();

    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    // Get user info for logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, sapId: true, role: true },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Prevent deleting other SUPER_ADMINs
    if (user.role === "SUPER_ADMIN") {
      return { success: false, message: "Cannot delete SUPER_ADMIN accounts" };
    }

    // Delete from Prisma first
    await prisma.user.delete({
      where: { id: userId },
    });

    // Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (authError) {
      console.error("Supabase Auth Delete Error:", authError);
      // User is already deleted from Prisma, log the issue
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "USER_DELETED",
        adminId: admin.id,
        targetId: null, // User no longer exists
        details: `Deleted user ${user.fullName} (${user.sapId})`,
      },
    });

    revalidatePath("/admin/students");

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error instanceof Error && error.message.includes("required")) {
      return { success: false, message: error.message };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}
