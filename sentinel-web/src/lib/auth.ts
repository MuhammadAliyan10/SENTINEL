"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@prisma/client";

/**
 * ============================================
 * UNIFIED AUTH GUARD
 * ============================================
 *
 * Central authorization module for all admin operations.
 * Uses Prisma User table (NOT Supabase profiles).
 *
 * This replaces the legacy requireAdmin() which checked
 * the Supabase profiles table for role 'admin'.
 */

export interface AuthenticatedUser {
  id: string;
  sapId: string;
  fullName: string | null;
  role: User["role"];
  isActive: boolean;
}

/**
 * Require SUPER_ADMIN role for server actions.
 * Throws an error if unauthorized - for use in Server Actions.
 *
 * @returns The authenticated SUPER_ADMIN user
 * @throws Error if not authenticated or not SUPER_ADMIN
 */
export async function requireSuperAdmin(): Promise<AuthenticatedUser> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    throw new Error("Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: {
      id: true,
      sapId: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error("User not found in database");
  }

  if (!user.isActive) {
    throw new Error("Account is disabled");
  }

  if (user.role !== "SUPER_ADMIN") {
    throw new Error("SUPER_ADMIN access required");
  }

  return user;
}

/**
 * Require SUPER_ADMIN role for page components.
 * Redirects if unauthorized - for use in Server Components.
 *
 * @returns The authenticated SUPER_ADMIN user
 * @redirects to /login if not authenticated
 * @redirects to /unauthorized if not SUPER_ADMIN
 */
export async function requireSuperAdminPage(): Promise<AuthenticatedUser> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: {
      id: true,
      sapId: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    redirect("/unauthorized");
  }

  if (user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Require any authenticated user.
 * For use in Server Actions that need auth but not admin.
 *
 * @returns The authenticated user
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    throw new Error("Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: {
      id: true,
      sapId: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error("User not found in database");
  }

  if (!user.isActive) {
    throw new Error("Account is disabled");
  }

  return user;
}

/**
 * Check if user has CR or GR role (manager).
 * For use when managers need to perform student operations.
 */
export async function requireManager(): Promise<AuthenticatedUser> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    throw new Error("Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: {
      id: true,
      sapId: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error("User not found in database");
  }

  if (!user.isActive) {
    throw new Error("Account is disabled");
  }

  if (!["SUPER_ADMIN", "CR", "GR"].includes(user.role)) {
    throw new Error("Manager access required");
  }

  return user;
}
