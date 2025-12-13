"use server";

import { prisma } from "@/lib/prisma";
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
