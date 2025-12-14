"use server";

import { prisma } from "@/lib/prisma";
import { safeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { cache } from "react";

/**
 * Cached auth context - prevents duplicate calls within same request
 */
const getAuthContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, dbUser: null };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      role: true,
      isActive: true,
      profileCompleted: true,
      fullName: true,
      sapId: true,
    },
  });

  return { user, dbUser };
});

/**
 * Get the role of the current authenticated user
 * Returns null if not authenticated or account is inactive
 */
export async function getUserRole() {
  const { dbUser } = await getAuthContext();

  if (!dbUser || !dbUser.isActive) {
    return null;
  }

  return dbUser.role;
}

/**
 * Student-specific auth check
 */
export async function getStudentAuth() {
  const { user, dbUser } = await getAuthContext();

  if (!user || !dbUser) {
    return null;
  }

  if (dbUser.role !== "STUDENT" || !dbUser.isActive) {
    return null;
  }

  return {
    userId: user.id,
    role: dbUser.role,
    profileCompleted: dbUser.profileCompleted,
    fullName: dbUser.fullName,
    sapId: dbUser.sapId,
  };
}

/**
 * Manager-specific auth check
 */
export async function getManagerAuth() {
  const { user, dbUser } = await getAuthContext();

  if (!user || !dbUser) {
    return null;
  }

  const validRoles = ["CR", "GR", "SUPER_ADMIN"];
  if (!validRoles.includes(dbUser.role) || !dbUser.isActive) {
    return null;
  }

  return {
    userId: user.id,
    role: dbUser.role,
    fullName: dbUser.fullName,
  };
}

/**
 * Log a successful admin/manager login
 * Uses safeAuditLog to prevent FK crashes if user record is missing
 */
export async function logSuccessfulLogin(userId: string, role: string) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Use safe audit log to prevent FK crashes
    await safeAuditLog({
      performerId: userId,
      action: "LOGIN_SUCCESS",
      details: `${role} logged in successfully`,
      ipAddress: ip,
      userAgent: userAgent,
    });
  } catch (error) {
    // Don't fail login if audit log fails
    console.error("Failed to log login:", error);
  }
}

/**
 * Log a failed login attempt
 */
export async function logFailedLogin(email: string, reason: string) {
  console.warn(`[SECURITY] Failed login attempt for ${email}: ${reason}`);
}

/**
 * Require SUPER_ADMIN role - throws if not authorized
 * Returns the admin user data
 */
export async function requireSuperAdmin() {
  const { user, dbUser } = await getAuthContext();

  if (!user || !dbUser) {
    throw new Error("Authentication required");
  }

  if (dbUser.role !== "SUPER_ADMIN" || !dbUser.isActive) {
    throw new Error("SUPER_ADMIN role required");
  }

  return {
    id: dbUser.id,
    role: dbUser.role,
    fullName: dbUser.fullName,
  };
}

/**
 * Require SUPER_ADMIN for page access - redirects if not authorized
 */
export async function requireSuperAdminPage() {
  const { user, dbUser } = await getAuthContext();

  if (!user || !dbUser) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
    return null as never; // TypeScript: redirect never returns
  }

  if (dbUser.role !== "SUPER_ADMIN" || !dbUser.isActive) {
    const { redirect } = await import("next/navigation");
    redirect("/unauthorized");
    return null as never;
  }

  return {
    id: dbUser.id,
    role: dbUser.role,
    fullName: dbUser.fullName,
  };
}

// =============================================================================
// LOGIN SERVER ACTIONS
// =============================================================================

/**
 * SECURITY: Validate redirect path to prevent open redirect attacks
 */
function validateAdminRedirectPath(path: string | undefined): string {
  const defaultPath = "/admin";
  if (!path) return defaultPath;
  if (
    !path.startsWith("/admin") ||
    path.startsWith("//") ||
    path.includes(":")
  ) {
    return defaultPath;
  }
  return path;
}

function validateManagerRedirectPath(path: string | undefined): string {
  const defaultPath = "/manager/dashboard";
  if (!path) return defaultPath;
  if (
    !path.startsWith("/manager") ||
    path.startsWith("//") ||
    path.includes(":")
  ) {
    return defaultPath;
  }
  return path;
}

/**
 * Server Action: Login as Admin (SUPER_ADMIN)
 * Handles authentication server-side to avoid cookie synchronization issues
 * SECURITY: Includes rate limiting to prevent brute force attacks
 */
export async function loginAdmin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirectTo") as string | undefined;

  // ============================================
  // INPUT VALIDATION
  // ============================================
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address" };
  }

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  // Sanitize email for logging
  const sanitizedEmail = email.toLowerCase().trim().slice(0, 100);

  // ============================================
  // RATE LIMITING: Max 5 failed attempts per 15 minutes
  // ============================================
  const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_FAILED_ATTEMPTS = 5;
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const recentFailures = await prisma.auditLog.count({
    where: {
      action: "LOGIN_FAILED_ADMIN",
      details: { contains: sanitizedEmail },
      timestamp: { gte: windowStart },
    },
  });

  if (recentFailures >= MAX_FAILED_ATTEMPTS) {
    const remainingMinutes = Math.ceil(RATE_LIMIT_WINDOW_MS / 60000);
    return {
      error: `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
    };
  }

  try {
    // ============================================
    // 1. Sign in with Supabase on the server
    // ============================================
    const supabase = await createClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

    if (authError) {
      // For pre-auth failures, we can't log to AuditLog (performerId required)
      // Use console warning instead for security monitoring
      console.warn(
        `[SECURITY] Failed admin login attempt for ${sanitizedEmail}: ${authError.message}`
      );
      return { error: "Invalid email or password" }; // Generic message
    }

    if (!authData.user) {
      await logFailedLogin(sanitizedEmail, "No user returned");
      return { error: "Authentication failed" };
    }

    // ============================================
    // 2. Verify role from database
    // ============================================
    const dbUser = await prisma.user.findUnique({
      where: { id: authData.user.id },
      select: { role: true, isActive: true },
    });

    if (!dbUser || !dbUser.isActive) {
      await supabase.auth.signOut();
      // Use safe audit log - won't crash if user record is missing
      await safeAuditLog({
        performerId: authData.user.id,
        action: "LOGIN_FAILED_ADMIN",
        details: JSON.stringify({
          email: sanitizedEmail,
          reason: "Account not found or inactive",
        }),
      });
      // Provide specific error for missing user record
      return {
        error: !dbUser
          ? "User record missing. Contact Admin."
          : "Account not found or inactive",
      };
    }

    if (dbUser.role !== "SUPER_ADMIN") {
      await supabase.auth.signOut();
      await safeAuditLog({
        performerId: authData.user.id,
        action: "LOGIN_FAILED_ADMIN",
        details: JSON.stringify({
          email: sanitizedEmail,
          reason: `Unauthorized role: ${dbUser.role}`,
        }),
      });
      return { error: "Access Denied: Administrator privileges required" };
    }

    // ============================================
    // 3. Log successful login
    // ============================================
    await logSuccessfulLogin(authData.user.id, "SUPER_ADMIN");

    // ============================================
    // 4. Redirect server-side
    // ============================================
    const safePath = validateAdminRedirectPath(redirectTo);
    const { redirect } = await import("next/navigation");
    redirect(safePath);
  } catch (error) {
    // Handle Next.js redirect (it throws an error)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Admin Login Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Server Action: Login as Manager (CR/GR)
 * Handles authentication server-side to avoid cookie synchronization issues
 * SECURITY: Includes rate limiting to prevent brute force attacks
 */
export async function loginManager(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirectTo") as string | undefined;

  // ============================================
  // INPUT VALIDATION
  // ============================================
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address" };
  }

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  // Sanitize email for logging
  const sanitizedEmail = email.toLowerCase().trim().slice(0, 100);

  // ============================================
  // RATE LIMITING: Max 5 failed attempts per 15 minutes
  // ============================================
  const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_FAILED_ATTEMPTS = 5;
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const recentFailures = await prisma.auditLog.count({
    where: {
      action: "LOGIN_FAILED_MANAGER",
      details: { contains: sanitizedEmail },
      timestamp: { gte: windowStart },
    },
  });

  if (recentFailures >= MAX_FAILED_ATTEMPTS) {
    const remainingMinutes = Math.ceil(RATE_LIMIT_WINDOW_MS / 60000);
    return {
      error: `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
    };
  }

  try {
    // ============================================
    // 1. Sign in with Supabase on the server
    // ============================================
    const supabase = await createClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

    if (authError) {
      // For pre-auth failures, we can't log to AuditLog (performerId required)
      // Use console warning instead for security monitoring
      console.warn(
        `[SECURITY] Failed manager login attempt for ${sanitizedEmail}: ${authError.message}`
      );
      return { error: "Invalid email or password" }; // Generic message
    }

    if (!authData.user) {
      await logFailedLogin(sanitizedEmail, "No user returned");
      return { error: "Authentication failed" };
    }

    // ============================================
    // 2. Verify role from database
    // ============================================
    const dbUser = await prisma.user.findUnique({
      where: { id: authData.user.id },
      select: { role: true, isActive: true },
    });

    if (!dbUser || !dbUser.isActive) {
      await supabase.auth.signOut();
      // Use safe audit log - won't crash if user record is missing
      await safeAuditLog({
        performerId: authData.user.id,
        action: "LOGIN_FAILED_MANAGER",
        details: JSON.stringify({
          email: sanitizedEmail,
          reason: "Account not found or inactive",
        }),
      });
      // Provide specific error for missing user record
      return {
        error: !dbUser
          ? "User record missing. Contact Admin."
          : "Account not found or inactive",
      };
    }

    const validRoles = ["CR", "GR", "SUPER_ADMIN"];
    if (!validRoles.includes(dbUser.role)) {
      await supabase.auth.signOut();
      await safeAuditLog({
        performerId: authData.user.id,
        action: "LOGIN_FAILED_MANAGER",
        details: JSON.stringify({
          email: sanitizedEmail,
          reason: `Unauthorized role: ${dbUser.role}`,
        }),
      });
      return { error: "Access Denied: Manager privileges required" };
    }

    // ============================================
    // 3. Log successful login
    // ============================================
    await logSuccessfulLogin(authData.user.id, dbUser.role);

    // ============================================
    // 4. Redirect server-side
    // ============================================
    const safePath = validateManagerRedirectPath(redirectTo);
    const { redirect } = await import("next/navigation");
    redirect(safePath);
  } catch (error) {
    // Handle Next.js redirect (it throws an error)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Manager Login Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
