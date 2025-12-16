/**
 * Guard Scan Verification API
 *
 * POST /api/guard/scan
 *
 * Verifies a student's TOTP code and logs entry/exit.
 *
 * Input: { studentId: string, code: string, type?: "ENTRY" | "EXIT" }
 * Output: { status: "GRANTED" | "REJECTED", reason?: string, student?: {...} }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/totp";
import { z } from "zod";

// Input validation schema
const ScanInputSchema = z.object({
  studentId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
  type: z.enum(["ENTRY", "EXIT"]).default("ENTRY"),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the guard/admin
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: "REJECTED", reason: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Verify the user is a GUARD or SUPER_ADMIN
    const scanner = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, isActive: true },
    });

    if (!scanner || !scanner.isActive) {
      return NextResponse.json(
        { status: "REJECTED", reason: "Scanner account inactive" },
        { status: 403 }
      );
    }

    if (!["GUARD", "SUPER_ADMIN"].includes(scanner.role)) {
      return NextResponse.json(
        { status: "REJECTED", reason: "Unauthorized: Guard access required" },
        { status: 403 }
      );
    }

    // 3. Parse and validate input
    const body = await request.json();
    const parseResult = ScanInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { status: "REJECTED", reason: "Invalid input format" },
        { status: 400 }
      );
    }

    const { studentId, code, type } = parseResult.data;

    // 4. Fetch the student
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        sapId: true,
        fullName: true,
        profilePhotoUrl: true,
        semester: true,
        section: true,
        qrSecret: true,
        isActive: true,
        isPaid: true,
        role: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { status: "REJECTED", reason: "Student not found" },
        { status: 404 }
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { status: "REJECTED", reason: "Not a student account" },
        { status: 400 }
      );
    }

    // 5. Verify TOTP code
    if (!student.qrSecret) {
      return NextResponse.json(
        { status: "REJECTED", reason: "QR not setup for this student" },
        { status: 400 }
      );
    }

    const isValidCode = verifyToken(student.qrSecret, code);
    if (!isValidCode) {
      return NextResponse.json({
        status: "REJECTED",
        reason: "Invalid or expired code",
        student: {
          name: student.fullName,
          sapId: student.sapId,
          photoUrl: student.profilePhotoUrl,
        },
      });
    }

    // 6. Check student status
    if (!student.isActive) {
      return NextResponse.json({
        status: "REJECTED",
        reason: "Student account deactivated (Banned)",
        student: {
          name: student.fullName,
          sapId: student.sapId,
          photoUrl: student.profilePhotoUrl,
        },
      });
    }

    if (!student.isPaid) {
      return NextResponse.json({
        status: "REJECTED",
        reason: "Payment pending",
        student: {
          name: student.fullName,
          sapId: student.sapId,
          photoUrl: student.profilePhotoUrl,
        },
      });
    }

    // 7. Anti-Passback Check: Get last access log
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const lastLog = await prisma.accessLog.findFirst({
      where: {
        userId: studentId,
        timestamp: { gte: todayStart },
      },
      orderBy: { timestamp: "desc" },
      select: { type: true },
    });

    if (type === "ENTRY") {
      if (lastLog?.type === "ENTRY") {
        return NextResponse.json({
          status: "REJECTED",
          reason: "Already inside (Anti-Passback)",
          student: {
            name: student.fullName,
            sapId: student.sapId,
            photoUrl: student.profilePhotoUrl,
          },
        });
      }
    } else if (type === "EXIT") {
      if (!lastLog || lastLog.type === "EXIT") {
        return NextResponse.json({
          status: "REJECTED",
          reason: "Not inside - cannot exit",
          student: {
            name: student.fullName,
            sapId: student.sapId,
            photoUrl: student.profilePhotoUrl,
          },
        });
      }
    }

    // 8. Success! Create access log
    await prisma.accessLog.create({
      data: {
        userId: studentId,
        scannerId: user.id,
        type: type,
        status: "GRANTED",
      },
    });

    // 9. Return success with student details
    const isReturning = lastLog?.type === "EXIT" && type === "ENTRY";

    return NextResponse.json({
      status: "GRANTED",
      isReturning,
      student: {
        name: student.fullName,
        sapId: student.sapId,
        photoUrl: student.profilePhotoUrl,
        semester: student.semester,
        section: student.section,
      },
    });
  } catch (error) {
    console.error("Scan verification error:", error);
    return NextResponse.json(
      { status: "REJECTED", reason: "Server error" },
      { status: 500 }
    );
  }
}
