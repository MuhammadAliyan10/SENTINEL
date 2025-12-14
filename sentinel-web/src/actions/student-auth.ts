"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { timingSafeEqual } from "crypto";

/**
 * SECURITY: Timing-safe string comparison
 * Prevents timing attacks by ensuring comparison takes constant time
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // To prevent length-based timing attacks, compare against itself
    // but return false. The comparison still runs to use same time.
    const dummyBuffer = Buffer.from(a, "utf8");
    timingSafeEqual(dummyBuffer, dummyBuffer);
    return false;
  }
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  return timingSafeEqual(bufferA, bufferB);
}

const loginSchema = z.object({
  sapId: z
    .string()
    .min(1, "SAP ID is required")
    .regex(/^\d{8}$/, "SAP ID must be exactly 8 digits"),
  token: z
    .string()
    .min(6, "Token must be 6 characters")
    .max(6, "Token must be 6 characters"),
  redirectTo: z.string().optional(),
});

// SECURITY: Rate limiting configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// SECURITY: Validate redirect path to prevent open redirect
function validateRedirectPath(path: string | undefined): string {
  const defaultPath = "/student/dashboard";
  if (!path) return defaultPath;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes(":")) {
    return defaultPath;
  }
  // Only allow paths starting with /student
  if (!path.startsWith("/student")) {
    return defaultPath;
  }
  return path;
}

export async function loginStudent(formData: FormData) {
  const sapId = formData.get("sapId") as string;
  const token = formData.get("token") as string;
  const redirectTo = formData.get("redirectTo") as string | undefined;

  const validation = loginSchema.safeParse({ sapId, token, redirectTo });

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    // 1. Find User in DB
    const user = await prisma.user.findUnique({
      where: { sapId },
      select: {
        id: true,
        role: true,
        activationToken: true,
        profileCompleted: true,
        isActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      return { error: "Invalid SAP ID or Token" };
    }

    // SECURITY: Check role - only STUDENTs can use this login
    if (user.role !== "STUDENT") {
      return {
        error: "Please use the appropriate login portal for your account type.",
      };
    }

    // SECURITY: Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      );
      return {
        error: `Account locked. Try again in ${remainingMinutes} minute${
          remainingMinutes > 1 ? "s" : ""
        }.`,
      };
    }

    // SECURITY: Check if account is active
    if (!user.isActive) {
      return { error: "Your account has been deactivated. Contact admin." };
    }

    // 2. Verify Token (case-insensitive, both stored and input as uppercase)
    // SECURITY: Use timing-safe comparison to prevent timing attacks
    const storedToken = user.activationToken?.toUpperCase() || "";
    const inputToken = token.toUpperCase();

    // CRITICAL FIX: Timing-safe comparison prevents timing attacks
    const tokenValid =
      storedToken.length > 0 && safeCompare(storedToken, inputToken);

    if (!tokenValid) {
      // SECURITY: Increment failed attempts
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
      const shouldLock = newFailedAttempts >= MAX_LOGIN_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lastFailedLogin: new Date(),
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
            : null,
        },
      });

      if (shouldLock) {
        return {
          error: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`,
        };
      }

      const remainingAttempts = MAX_LOGIN_ATTEMPTS - newFailedAttempts;
      return {
        error: `Invalid SAP ID or Token. ${remainingAttempts} attempt${
          remainingAttempts > 1 ? "s" : ""
        } remaining.`,
      };
    }

    // 3. Sign In with Supabase Auth
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${sapId}@sentinel.edu`,
      password: inputToken, // Use uppercase token
    });

    if (signInError) {
      console.error("Supabase Login Error:", signInError.message);
      return { error: "Authentication failed. Please check your token." };
    }

    // SECURITY: Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastFailedLogin: null,
        },
      });
    }

    // AUDIT: Log successful login
    await prisma.auditLog.create({
      data: {
        action: "LOGIN_SUCCESS",
        performerId: user.id,
        details: `Student ${sapId} logged in successfully`,
      },
    });

    // 4. Redirect based on profile status
    if (!user.profileCompleted) {
      redirect("/student/onboarding");
    } else {
      const safePath = validateRedirectPath(redirectTo);
      redirect(safePath);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Login Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
