import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logger, generateRequestId } from "@/lib/logger";
import { verifySignature, parseQrPayload } from "@/lib/security/hmac";
import {
  TIME,
  SCAN_TYPE,
  SCAN_STATUS,
  GUARD_APP_AUTHORIZED_ROLES,
} from "@/lib/constants";

// ============================================
// SERVER-SIDE QR VERIFICATION API
// ============================================
// Guards POST scan data, server verifies signature
// Guards NEVER see student's activation_token
//
// This provides:
// 1. Security: Token never leaves server
// 2. Audit: All verifications logged on server
// 3. Offline fallback: Mobile app falls back to local HMAC if this fails

export interface VerifyRequest {
  qrData: string; // Raw QR code string
  scanType: "ENTRY" | "EXIT";
  eventId?: string;
}

export interface VerifyResponse {
  success: boolean;
  status: "GRANTED" | "REJECTED" | "DUPLICATE";
  reason?: string;
  student?: {
    id: string;
    sapId: string;
    fullName: string | null;
    section: string | null;
    semester: string | null;
    profilePhotoUrl: string | null;
  };
  isReturning?: boolean;
  accessLogId?: string;
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({ requestId, action: "verify_qr" });

  try {
    // ============================================
    // 1. AUTHENTICATE GUARD
    // ============================================
    const supabase = await createClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    // FALLBACK: Check Authorization header for Mobile App (Bearer Token)
    if (!user) {
      const authHeader = request.headers.get("Authorization");
      console.log("[API] Auth Header:", authHeader ? "Present" : "Missing"); // DEBUG

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        console.log("[API] Token extracted, verifying..."); // DEBUG

        const {
          data: { user: mobileUser },
          error: mobileError,
        } = await supabase.auth.getUser(token);

        if (mobileError) {
          console.error(
            "[API] Token verification failed:",
            mobileError.message
          ); // DEBUG
        }

        if (mobileUser) {
          console.log("[API] Token verified for user:", mobileUser.id); // DEBUG
          user = mobileUser;
        }
      }
    }

    if (!user) {
      reqLogger.warn("Unauthenticated verification attempt");
      return NextResponse.json(
        { success: false, status: "REJECTED", reason: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    // Verify guard role
    const guard = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, isActive: true, fullName: true },
    });

    if (!guard || !guard.isActive) {
      reqLogger.warn("Inactive guard attempt", { userId: user.id });
      return NextResponse.json(
        { success: false, status: "REJECTED", reason: "GUARD_INACTIVE" },
        { status: 403 }
      );
    }

    if (!GUARD_APP_AUTHORIZED_ROLES.includes(guard.role as any)) {
      reqLogger.warn("Unauthorized role attempt", {
        userId: user.id,
        role: guard.role,
      });
      return NextResponse.json(
        { success: false, status: "REJECTED", reason: "UNAUTHORIZED_ROLE" },
        { status: 403 }
      );
    }

    // ============================================
    // 2. PARSE REQUEST
    // ============================================
    const body: VerifyRequest = await request.json();
    const { qrData, scanType, eventId } = body;

    if (!qrData || !scanType) {
      return NextResponse.json(
        { success: false, status: "REJECTED", reason: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    reqLogger.info("Processing scan", { scanType, guardId: guard.id });

    // ============================================
    // 3. PARSE QR PAYLOAD
    // ============================================
    const payload = parseQrPayload(qrData);
    if (!payload) {
      reqLogger.warn("Invalid QR format", { guardId: guard.id });
      return NextResponse.json({
        success: false,
        status: "REJECTED",
        reason: "INVALID_QR_FORMAT",
      });
    }

    // ============================================
    // 4. FETCH STUDENT (with activation token - SERVER ONLY)
    // ============================================
    const student = await prisma.user.findUnique({
      where: { sapId: payload.sap },
      select: {
        id: true,
        sapId: true,
        fullName: true,
        section: true,
        semester: true,
        profilePhotoUrl: true,
        isPaid: true,
        isActive: true,
        activationToken: true, // Server-side only, never exposed to client
      },
    });

    if (!student) {
      reqLogger.warn("Student not found", { sapId: payload.sap });
      return NextResponse.json({
        success: false,
        status: "REJECTED",
        reason: "STUDENT_NOT_FOUND",
      });
    }

    // ============================================
    // 5. VALIDATE STUDENT STATUS
    // ============================================
    if (!student.isPaid) {
      return NextResponse.json({
        success: false,
        status: "REJECTED",
        reason: "PAYMENT_PENDING",
        student: sanitizeStudent(student),
      });
    }

    if (!student.isActive) {
      return NextResponse.json({
        success: false,
        status: "REJECTED",
        reason: "STUDENT_DEACTIVATED",
        student: sanitizeStudent(student),
      });
    }

    if (!student.activationToken) {
      return NextResponse.json({
        success: false,
        status: "REJECTED",
        reason: "NO_ACTIVATION_TOKEN",
      });
    }

    // ============================================
    // 6. VERIFY SIGNATURE (server-side, token never exposed)
    // ============================================
    const sigResult = verifySignature(payload, student.activationToken);
    if (!sigResult.valid) {
      reqLogger.warn("Signature verification failed", {
        reason: sigResult.reason,
        studentId: student.id,
      });
      return NextResponse.json({
        success: false,
        status: "REJECTED",
        reason: sigResult.reason,
        student: sanitizeStudent(student),
      });
    }

    // ============================================
    // 7. CHECK DUPLICATE ENTRY/EXIT
    // ============================================
    const recentLog = await prisma.accessLog.findFirst({
      where: {
        userId: student.id,
        timestamp: {
          gte: new Date(Date.now() - TIME.ACCESS_LOG_WINDOW_MS),
        },
      },
      orderBy: { timestamp: "desc" },
    });

    let status: "GRANTED" | "DUPLICATE" = "GRANTED";
    let isReturning = false;

    if (scanType === SCAN_TYPE.ENTRY) {
      if (recentLog?.type === "ENTRY") {
        return NextResponse.json({
          success: false,
          status: "DUPLICATE",
          reason: "ALREADY_INSIDE",
          student: sanitizeStudent(student),
        });
      }
      if (recentLog?.type === "EXIT") {
        isReturning = true;
      }
    } else if (scanType === SCAN_TYPE.EXIT) {
      if (!recentLog || recentLog.type === "EXIT") {
        return NextResponse.json({
          success: false,
          status: "DUPLICATE",
          reason: "NOT_INSIDE",
          student: sanitizeStudent(student),
        });
      }
    }

    // ============================================
    // 8. CREATE ACCESS LOG
    // ============================================
    const accessLog = await prisma.accessLog.create({
      data: {
        userId: student.id,
        scannerId: guard.id,
        eventId: eventId || undefined,
        type: scanType,
        status: status,
      },
    });

    reqLogger.info("Scan completed successfully", {
      studentId: student.id,
      guardId: guard.id,
      scanType,
      status,
      accessLogId: accessLog.id,
    });

    // ============================================
    // 9. RETURN SUCCESS
    // ============================================
    return NextResponse.json({
      success: true,
      status: "GRANTED",
      student: sanitizeStudent(student),
      isReturning,
      accessLogId: accessLog.id,
    });
  } catch (error) {
    reqLogger.error("Verification error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        status: "REJECTED",
        reason: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// Helper: Remove sensitive fields from student object
function sanitizeStudent(student: {
  id: string;
  sapId: string;
  fullName: string | null;
  section: string | null;
  semester: string | null;
  profilePhotoUrl: string | null;
}) {
  return {
    id: student.id,
    sapId: student.sapId,
    fullName: student.fullName,
    section: student.section,
    semester: student.semester,
    profilePhotoUrl: student.profilePhotoUrl,
  };
}
