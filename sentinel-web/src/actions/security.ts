"use server";

import { authenticator } from "otplib";
import { createClient, requireAuth } from "@/lib/supabase/server";

// Configure TOTP authenticator
authenticator.options = {
  digits: 6,
  step: 30,
  window: 1,
};

export interface TOTPResult {
  success: boolean;
  code?: string;
  expiresIn?: number;
  message?: string;
}

/**
 * Server Action: Generate a real TOTP code for the authenticated user
 * This uses the user's actual totp_secret stored in the database
 * SECURITY: The secret is NEVER returned to the client
 */
export async function generateTimeToken(): Promise<TOTPResult> {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    // Get the user's TOTP secret (only accessible server-side)
    const supabase = await createClient();
    const { data: profile, error } = (await supabase
      .from("profiles")
      .select("totp_secret, payment_status")
      .eq("id", userId)
      .single()) as {
      data: { totp_secret: string; payment_status: boolean } | null;
      error: unknown;
    };

    if (error || !profile) {
      return {
        success: false,
        message: "Profile not found",
      };
    }

    // Check payment status
    if (!profile.payment_status) {
      return {
        success: false,
        message: "Payment required to generate access code",
      };
    }

    // Generate the TOTP code using the secret
    const code = authenticator.generate(profile.totp_secret);

    // Calculate time until expiration
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 30 - (now % 30);

    return {
      success: true,
      code,
      expiresIn,
    };
  } catch (error) {
    console.error("Error generating TOTP:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to generate code",
    };
  }
}

/**
 * Server Action: Verify a TOTP code for a specific user
 * Used by guards to validate student entry
 */
export async function verifyTimeToken(
  sapId: string,
  code: string
): Promise<{
  valid: boolean;
  message: string;
  profile?: { full_name: string; sap_id: string; payment_status: boolean };
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        valid: false,
        message: "Authentication required",
      };
    }

    // Check if user is admin or guard
    const { data: verifierProfile } = (await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()) as { data: { role: string } | null };

    if (
      !verifierProfile ||
      !["admin", "guard"].includes(verifierProfile.role)
    ) {
      return {
        valid: false,
        message: "Unauthorized: Guard or Admin access required",
      };
    }

    // Find the user by SAP ID
    const { data: profile, error } = (await supabase
      .from("profiles")
      .select("id, full_name, sap_id, totp_secret, payment_status")
      .eq("sap_id", sapId)
      .single()) as {
      data: {
        id: string;
        full_name: string;
        sap_id: string;
        totp_secret: string;
        payment_status: boolean;
      } | null;
      error: unknown;
    };

    if (error || !profile) {
      return {
        valid: false,
        message: "Student not found",
      };
    }

    // Check payment status
    if (!profile.payment_status) {
      return {
        valid: false,
        message: "Payment pending - access denied",
        profile: {
          full_name: profile.full_name,
          sap_id: profile.sap_id,
          payment_status: false,
        },
      };
    }

    // Verify the TOTP code
    const isValid = authenticator.verify({
      token: code,
      secret: profile.totp_secret,
    });

    return {
      valid: isValid,
      message: isValid ? "Access granted" : "Invalid code",
      profile: {
        full_name: profile.full_name,
        sap_id: profile.sap_id,
        payment_status: profile.payment_status,
      },
    };
  } catch (error) {
    console.error("Error verifying TOTP:", error);
    return {
      valid: false,
      message: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

/**
 * Get the current TOTP window info (for UI display)
 */
export async function getTOTPWindow(): Promise<{
  step: number;
  remaining: number;
}> {
  const now = Math.floor(Date.now() / 1000);
  return {
    step: 30,
    remaining: 30 - (now % 30),
  };
}
