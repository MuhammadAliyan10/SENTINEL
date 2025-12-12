"use server";

import { authenticator } from "otplib";
import { revalidatePath } from "next/cache";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

// Configure TOTP authenticator
authenticator.options = {
  digits: 6,
  step: 30,
  window: 1,
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CreateUserInput {
  fullName: string;
  sapId: string; // 8-digit SAP ID
  email: string;
  role?: UserRole;
  paymentStatus?: boolean;
}

export interface CreateUserResult {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Server Action: Create a new user with auto-generated TOTP secret
 * SECURED: Requires admin authentication
 */
export async function createUser(
  input: CreateUserInput
): Promise<CreateUserResult> {
  try {
    // ============================================
    // AUTHORIZATION CHECK - Require Admin Role
    // ============================================
    await requireAdmin();

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

    const supabase = await createClient();

    // ============================================
    // CHECK FOR DUPLICATE SAP ID
    // ============================================
    const { data: existing } = (await supabase
      .from("profiles")
      .select("sap_id")
      .eq("sap_id", input.sapId.trim())
      .single()) as { data: { sap_id: string } | null };

    if (existing) {
      return {
        success: false,
        message: `SAP ID ${input.sapId} already exists`,
      };
    }

    // ============================================
    // GENERATE SECURE TOTP SECRET
    // ============================================
    const totpSecret = authenticator.generateSecret();

    // ============================================
    // CREATE USER IN SUPABASE AUTH
    // Note: In production, use supabase.auth.admin.createUser()
    // This requires a service role key
    // ============================================

    // For now, we simulate the creation
    // TODO: Replace with actual Supabase Admin API call
    // const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    //   email: input.email,
    //   email_confirm: true,
    //   user_metadata: { full_name: input.fullName },
    // });
    //
    // if (authError) throw authError;
    //
    // // Update the profile with additional fields
    // const { error: profileError } = await supabase.from("profiles").update({
    //   sap_id: input.sapId.trim(),
    //   role: input.role || "student",
    //   payment_status: input.paymentStatus || false,
    //   totp_secret: totpSecret,
    // }).eq("id", authData.user.id);
    //
    // if (profileError) throw profileError;

    // Simulate API delay for demo
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Revalidate the students page
    revalidatePath("/admin/students");

    return {
      success: true,
      message: `Student "${input.fullName}" created successfully`,
      userId: "mock-user-id-" + Date.now(),
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
 * SECURED: Requires admin authentication
 */
export async function updatePaymentStatus(
  userId: string,
  paymentStatus: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    // ============================================
    // AUTHORIZATION CHECK
    // ============================================
    await requireAdmin();

    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    const supabase = await createClient();

    // Update in database
    const { error } = await supabase
      .from("profiles")
      .update({ payment_status: paymentStatus } as never)
      .eq("id", userId);

    if (error) throw error;

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
 * SECURED: Requires admin authentication
 */
export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // ============================================
    // AUTHORIZATION CHECK
    // ============================================
    await requireAdmin();

    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    const supabase = await createClient();

    // Soft delete: Mark as deleted instead of actual deletion
    // For hard delete, use: supabaseAdmin.auth.admin.deleteUser(userId)
    // Using actual delete for now since profiles cascade from auth.users
    const { error } = await supabase.from("profiles").delete().eq("id", userId);

    if (error) throw error;

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

/**
 * Server Action: Regenerate TOTP secret for a user
 * SECURED: Requires admin authentication
 */
export async function regenerateTotpSecret(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // ============================================
    // AUTHORIZATION CHECK
    // ============================================
    await requireAdmin();

    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    const newSecret = authenticator.generateSecret();

    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ totp_secret: newSecret } as never)
      .eq("id", userId);

    if (error) throw error;

    return {
      success: true,
      message: "TOTP secret regenerated. User will need to re-sync their pass.",
    };
  } catch (error) {
    console.error("Error regenerating TOTP secret:", error);

    if (error instanceof Error && error.message.includes("required")) {
      return { success: false, message: error.message };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to regenerate TOTP secret",
    };
  }
}
