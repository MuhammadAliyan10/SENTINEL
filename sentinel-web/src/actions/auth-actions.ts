"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Get the role of the current authenticated user
 * Returns null if not authenticated or account is inactive
 */
export async function getUserRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, isActive: true },
  });

  if (!dbUser || !dbUser.isActive) {
    return null;
  }

  return dbUser.role;
}

import { headers } from "next/headers";

/**
 * Log a successful admin/manager login
 * Called from login pages after successful authentication
 */
export async function logSuccessfulLogin(userId: string, role: string) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await prisma.auditLog.create({
      data: {
        action: "LOGIN_SUCCESS",
        performerId: userId,
        details: `${role} logged in successfully`,
        ipAddress: ip,
        userAgent: userAgent,
      },
    });
  } catch (error) {
    // Don't fail login if audit log fails
    console.error("Failed to log login:", error);
  }
}

/**
 * Log a failed login attempt
 * Note: For failed logins where we have no user, we use console.warn
 * since AuditLog requires a performerId. Consider adding a separate
 * SecurityLog table for anonymous events in future.
 */
export async function logFailedLogin(email: string, reason: string) {
  // Since AuditLog requires a performerId and we don't have one for failed logins,
  // we log to console. For production, consider:
  // 1. A separate SecurityLog table with optional performer
  // 2. An external logging service (DataDog, Sentry, etc.)
  console.warn(`[SECURITY] Failed login attempt for ${email}: ${reason}`);

  // Future: Could check if email exists and log with their ID
  // But that would leak information about valid emails
}
