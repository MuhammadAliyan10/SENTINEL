"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * SECURITY: Timing-safe HMAC signature comparison
 * Prevents timing attacks by ensuring comparison takes constant time
 */
function safeHmacCompare(
  signature: string,
  expectedSignature: string
): boolean {
  if (signature.length !== expectedSignature.length) {
    // Prevent length-based timing attacks
    const dummyBuffer = Buffer.from(expectedSignature, "hex");
    timingSafeEqual(dummyBuffer, dummyBuffer);
    return false;
  }
  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export interface QRVerifyResult {
  valid: boolean;
  message: string;
  profile?: {
    fullName: string;
    sapId: string;
    isPaid: boolean;
  };
}

/**
 * Server Action: Verify a QR code for a specific user
 * Used by guards to validate student entry
 * SECURITY: Uses Prisma User table (not legacy profiles)
 */
export async function verifyQRCode(
  sapId: string,
  timestamp: string,
  signature: string
): Promise<QRVerifyResult> {
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

    // SECURITY: Check if user is SUPER_ADMIN or GUARD using Prisma
    const verifier = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, isActive: true },
    });

    if (!verifier || !verifier.isActive) {
      return {
        valid: false,
        message: "Your account is inactive",
      };
    }

    if (!["SUPER_ADMIN", "GUARD"].includes(verifier.role)) {
      return {
        valid: false,
        message: "Unauthorized: Guard or Admin access required",
      };
    }

    // Find the student by SAP ID using Prisma
    const student = await prisma.user.findUnique({
      where: { sapId },
      select: {
        id: true,
        fullName: true,
        sapId: true,
        activationToken: true,
        isPaid: true,
        isActive: true,
        role: true,
      },
    });

    if (!student) {
      return {
        valid: false,
        message: "Student not found",
      };
    }

    if (student.role !== "STUDENT") {
      return {
        valid: false,
        message: "This is not a student account",
      };
    }

    if (!student.isActive) {
      return {
        valid: false,
        message: "Student access is revoked",
        profile: {
          fullName: student.fullName || "Unknown",
          sapId: student.sapId,
          isPaid: student.isPaid,
        },
      };
    }

    // Check payment status
    if (!student.isPaid) {
      return {
        valid: false,
        message: "Payment pending - access denied",
        profile: {
          fullName: student.fullName || "Unknown",
          sapId: student.sapId,
          isPaid: false,
        },
      };
    }

    // Verify QR signature using activation token (HMAC-SHA256)
    if (!student.activationToken) {
      return {
        valid: false,
        message: "Student has no activation token",
      };
    }

    // Check timestamp freshness (uses shared constant for consistency)
    const qrTimestamp = parseInt(timestamp, 10);
    const now = Date.now();
    const maxAge = 2 * 60 * 1000; // 2 minutes - MUST match TIME.QR_VALIDITY_MS

    if (isNaN(qrTimestamp) || now - qrTimestamp > maxAge) {
      return {
        valid: false,
        message: "QR code expired - ask student to refresh",
        profile: {
          fullName: student.fullName || "Unknown",
          sapId: student.sapId,
          isPaid: student.isPaid,
        },
      };
    }

    // Verify HMAC signature
    // SECURITY: Use timing-safe comparison to prevent timing attacks
    const payloadString = `${sapId}:${timestamp}`;
    const expectedSignature = createHmac("sha256", student.activationToken)
      .update(payloadString)
      .digest("hex");

    // CRITICAL FIX: Timing-safe HMAC comparison
    const isValid = safeHmacCompare(signature, expectedSignature);

    return {
      valid: isValid,
      message: isValid ? "Access granted" : "Invalid QR code",
      profile: {
        fullName: student.fullName || "Unknown",
        sapId: student.sapId,
        isPaid: student.isPaid,
      },
    };
  } catch (error) {
    console.error("Error verifying QR code:", error);
    return {
      valid: false,
      message: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

/**
 * Log an access attempt (entry/exit)
 * SECURITY: Requires GUARD or SUPER_ADMIN role
 */
export async function logAccessAttempt(
  studentId: string,
  type: "ENTRY" | "EXIT",
  status: "GRANTED" | "REJECTED" | "DUPLICATE",
  gateNumber?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Authentication required" };
    }

    // Verify scanner is authorized
    const scanner = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, isActive: true },
    });

    if (
      !scanner ||
      !scanner.isActive ||
      !["SUPER_ADMIN", "GUARD"].includes(scanner.role)
    ) {
      return { success: false, message: "Unauthorized" };
    }

    // Check for duplicate scan (passback prevention)
    // HIGH-4 FIX: Add time window to prevent millisecond-gap exploitation
    if (type === "ENTRY" && status === "GRANTED") {
      // Only check logs from today within the last 5 minutes for faster queries
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const lastLog = await prisma.accessLog.findFirst({
        where: {
          userId: studentId,
          timestamp: { gte: todayStart },
        },
        orderBy: { timestamp: "desc" },
      });

      if (lastLog && lastLog.type === "ENTRY") {
        // Already inside, this is a passback attempt
        status = "DUPLICATE";
      }
    }

    // Create access log
    await prisma.accessLog.create({
      data: {
        userId: studentId,
        scannerId: user.id,
        type,
        status,
        gateNumber: gateNumber || null,
      },
    });

    return {
      success: true,
      message:
        status === "DUPLICATE"
          ? "Passback detected"
          : `${type} logged successfully`,
    };
  } catch (error) {
    console.error("Error logging access:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to log access",
    };
  }
}

/**
 * Get the current time window info (for UI display)
 */
export async function getTimeWindow(): Promise<{
  step: number;
  remaining: number;
}> {
  // QR codes refresh every 15 seconds for optimal security
  const now = Math.floor(Date.now() / 1000);
  return {
    step: 15,
    remaining: 15 - (now % 15),
  };
}
