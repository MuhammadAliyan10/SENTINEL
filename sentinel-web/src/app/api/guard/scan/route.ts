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
    const parseResult = ScanInputSchema.extend({
      isOfflineLog: z.boolean().optional(),
    }).safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { status: "REJECTED", reason: "Invalid input format" },
        { status: 400 }
      );
    }

    const { studentId, code, type, isOfflineLog } = parseResult.data;

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

    // 5. Verify TOTP code (Skip if offline log)
    if (!isOfflineLog) {
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

    // 7. Fetch Active Event
    const activeEvent = await prisma.event.findFirst({
      where: { isDefault: true },
      select: { id: true, name: true },
    });

    if (!activeEvent) {
      return NextResponse.json(
        { status: "REJECTED", reason: "No active event found" },
        { status: 400 }
      );
    }

    // 8. Transaction: Anti-Passback & Log Creation
    const result = await prisma.$transaction(async (tx) => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Get last log for this user today
      const lastLog = await tx.accessLog.findFirst({
        where: {
          userId: studentId,
          timestamp: { gte: todayStart },
        },
        orderBy: { timestamp: "desc" },
        select: { type: true },
      });

      let status: "GRANTED" | "REJECTED" | "DUPLICATE" = "GRANTED";
      let reason: string | undefined = undefined;
      let isReturning = false;
      let metadata: any = undefined;

      if (type === "ENTRY") {
        if (lastLog?.type === "ENTRY") {
          status = "DUPLICATE";
          reason = "Already inside (Anti-Passback)";
        } else if (lastLog?.type === "EXIT") {
          isReturning = true;
        }
      } else if (type === "EXIT") {
        if (!lastLog || lastLog.type === "EXIT") {
          // Soft Fail: Allow exit but flag it
          status = "GRANTED"; // Allow them to leave
          reason = "Unmatched Exit (No Entry Found)";
          metadata = { warning: "Unmatched Exit" };
        }
      }

      // Create Log
      await tx.accessLog.create({
        data: {
          userId: studentId,
          scannerId: user.id,
          eventId: activeEvent.id,
          type: type,
          status: status,
          metadata: metadata,
        },
      });

      return { status, reason, isReturning };
    });

    // 9. Return result
    return NextResponse.json({
      status: result.status,
      reason: result.reason,
      isReturning: result.isReturning,
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
