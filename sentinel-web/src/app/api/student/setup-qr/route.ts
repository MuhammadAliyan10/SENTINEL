/**
 * Student Setup QR API
 *
 * GET /api/student/setup-qr
 *
 * Returns the student's TOTP secret for offline QR generation.
 * If no secret exists, generates and saves a new one.
 *
 * SECURITY: Only the authenticated student can fetch their own secret.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateSecret } from "@/lib/auth/totp";

export async function GET() {
  try {
    // 1. Authenticate the request
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Verify the user is a student and active
    const student = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        isActive: true,
        isPaid: true,
        qrSecret: true,
        sapId: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can access this endpoint" },
        { status: 403 }
      );
    }

    if (!student.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated" },
        { status: 403 }
      );
    }

    if (!student.isPaid) {
      return NextResponse.json(
        { error: "Payment required to access QR features" },
        { status: 403 }
      );
    }

    // 3. Return existing secret or generate new one
    let qrSecret = student.qrSecret;

    if (!qrSecret) {
      // Generate new TOTP secret
      qrSecret = generateSecret();

      // Save to database
      await prisma.user.update({
        where: { id: user.id },
        data: { qrSecret },
      });
    }

    // 4. Return the secret (will be stored in SecureStore on mobile)
    return NextResponse.json({
      secret: qrSecret,
      userId: student.id,
      sapId: student.sapId,
      config: {
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      },
    });
  } catch (error) {
    console.error("Setup QR error:", error);
    return NextResponse.json({ error: "Failed to setup QR" }, { status: 500 });
  }
}
