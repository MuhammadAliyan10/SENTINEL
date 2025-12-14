"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin as requireSuperAdminAuth } from "@/actions/auth-actions";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// Use centralized auth
async function requireSuperAdmin(): Promise<string> {
  const user = await requireSuperAdminAuth();
  return user.id;
}

// ============================================
// TYPES
// ============================================

export interface StudentSearchResult {
  id: string;
  sapId: string;
  fullName: string | null;
  role: string;
  gender: string | null;
  isPaid: boolean;
  profileCompleted: boolean;
  isActive: boolean;
  section: string | null;
  department: string | null;
  semester: string | null;
  profilePhotoUrl: string | null;
  createdAt: Date;
  createdBy: {
    id: string;
    fullName: string | null;
    role: string;
  } | null;
  accessLogs: {
    id: string;
    timestamp: Date;
    status: string;
    gateNumber: string | null;
  }[];
}

export interface ActionResult {
  success: boolean;
  message: string;
}

// Use centralized auth from above

// ============================================
// SEARCH STUDENTS
// ============================================

// SECURITY: Maximum search query length to prevent DoS
const MAX_SEARCH_LENGTH = 100;

export async function searchStudents(query: string): Promise<{
  success: boolean;
  students: StudentSearchResult[];
  message?: string;
}> {
  try {
    await requireSuperAdmin();

    if (!query || query.trim().length < 3) {
      return {
        success: false,
        students: [],
        message: "Search query must be at least 3 characters",
      };
    }

    // SECURITY: Limit query length to prevent DoS
    if (query.length > MAX_SEARCH_LENGTH) {
      return {
        success: false,
        students: [],
        message: `Search query too long (max ${MAX_SEARCH_LENGTH} characters)`,
      };
    }

    const searchTerm = query.trim();
    const isSapId = /^\d+$/.test(searchTerm);

    const where: Prisma.UserWhereInput = {
      role: "STUDENT",
      OR: [
        { fullName: { contains: searchTerm, mode: "insensitive" } },
        { sapId: { contains: searchTerm } },
      ],
    };

    const students = await prisma.user.findMany({
      where,
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        sapId: true,
        fullName: true,
        role: true,
        gender: true,
        isPaid: true,
        profileCompleted: true,
        isActive: true,
        section: true,
        department: true,
        semester: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
        accessLogs: {
          orderBy: { timestamp: "desc" },
          take: 5,
          select: {
            id: true,
            timestamp: true,
            status: true,
            gateNumber: true,
          },
        },
        profilePhotoUrl: true,
      },
    });

    return {
      success: true,
      students: students as StudentSearchResult[],
    };
  } catch (error) {
    console.error("Search Students Error:", error);
    return {
      success: false,
      students: [],
      message: error instanceof Error ? error.message : "Search failed",
    };
  }
}

// ============================================
// REVOKE STUDENT ACCESS
// ============================================

export async function revokeStudentAccess(
  userId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const adminId = await requireSuperAdmin();

    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    if (!reason || reason.trim().length < 5) {
      return {
        success: false,
        message: "Please provide a reason (min 5 characters)",
      };
    }

    // Verify target exists and get info
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { sapId: true, fullName: true, role: true, isActive: true },
    });

    if (!student) {
      return { success: false, message: "Student not found" };
    }

    if (!student.isActive) {
      return { success: false, message: "Student access is already revoked" };
    }

    // Revoke access
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        performerId: adminId,
        action: "REVOKE_ACCESS",
        targetId: userId,
        details: `Revoked access for ${student.sapId} (${
          student.fullName || "Unknown"
        }). Reason: ${reason.trim()}`,
      },
    });

    revalidatePath("/admin/students");

    return {
      success: true,
      message: `Access revoked for ${student.sapId}`,
    };
  } catch (error) {
    console.error("Revoke Access Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to revoke access",
    };
  }
}

// ============================================
// RESTORE STUDENT ACCESS
// ============================================

export async function restoreStudentAccess(
  userId: string
): Promise<ActionResult> {
  try {
    const adminId = await requireSuperAdmin();

    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    // Verify target exists
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { sapId: true, fullName: true, isActive: true },
    });

    if (!student) {
      return { success: false, message: "Student not found" };
    }

    if (student.isActive) {
      return { success: false, message: "Student access is already active" };
    }

    // Restore access
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        performerId: adminId,
        action: "RESTORE_ACCESS",
        targetId: userId,
        details: `Restored access for ${student.sapId} (${
          student.fullName || "Unknown"
        })`,
      },
    });

    revalidatePath("/admin/students");

    return {
      success: true,
      message: `Access restored for ${student.sapId}`,
    };
  } catch (error) {
    console.error("Restore Access Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to restore access",
    };
  }
}

// ============================================
// GET STUDENT STATS (Cached)
// ============================================

export interface StudentStats {
  totalStudents: number;
  paidStudents: number;
  unpaidStudents: number;
  profileCompleted: number;
  bySemester: { semester: string; count: number }[];
  bySection: { section: string; count: number }[];
}

import { unstable_cache } from "next/cache";

// Internal cached function - NO AUTH HERE
const getCachedStats = unstable_cache(
  async () => {
    const [total, paid, completed, semesterGroups, sectionGroups] =
      await prisma.$transaction([
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.user.count({ where: { role: "STUDENT", isPaid: true } }),
        prisma.user.count({
          where: { role: "STUDENT", profileCompleted: true },
        }),
        prisma.user.groupBy({
          by: ["semester"],
          where: { role: "STUDENT", semester: { not: null } },
          _count: { semester: true },
          orderBy: { semester: "asc" },
        }),
        prisma.user.groupBy({
          by: ["section"],
          where: { role: "STUDENT", section: { not: null } },
          _count: { section: true },
          orderBy: { section: "asc" },
        }),
      ]);

    return {
      totalStudents: total,
      paidStudents: paid,
      unpaidStudents: total - paid,
      profileCompleted: completed,
      // FIX: Safely access Prisma groupBy aggregate counts
      bySemester: semesterGroups.map((g) => ({
        semester: g.semester ?? "Unknown",
        count:
          typeof g._count === "object" && g._count !== null
            ? (g._count as Record<string, number>).semester ?? 0
            : 0,
      })),
      bySection: sectionGroups.map((g) => ({
        section: g.section ?? "Unknown",
        count:
          typeof g._count === "object" && g._count !== null
            ? (g._count as Record<string, number>).section ?? 0
            : 0,
      })),
    };
  },
  ["student-stats"],
  { revalidate: 300, tags: ["student-stats"] }
);

// Public Server Action - AUTH HERE
export async function getStudentStats(): Promise<StudentStats> {
  await requireSuperAdmin();
  return getCachedStats();
}

// ============================================
// GET ALL STUDENTS (Paginated Directory)
// ============================================

export interface StudentDirectoryRow {
  id: string;
  sapId: string;
  fullName: string | null;
  section: string | null;
  semester: string | null;
  isPaid: boolean;
  isActive: boolean;
  profilePhotoUrl: string | null;
  managerName: string | null;
}

export async function getAllStudents(
  page: number = 1,
  limit: number = 20,
  filter: "all" | "paid" | "unpaid" = "all"
): Promise<{
  data: StudentDirectoryRow[];
  total: number;
  pageCount: number;
}> {
  await requireSuperAdmin();

  // SECURITY: Validate pagination parameters to prevent DoS
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  const skip = (safePage - 1) * safeLimit;
  const where: any = { role: "STUDENT" };

  if (filter === "paid") where.isPaid = true;
  if (filter === "unpaid") where.isPaid = false;

  const [students, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        sapId: true,
        fullName: true,
        section: true,
        semester: true,
        isPaid: true,
        isActive: true,
        profilePhotoUrl: true,
        createdBy: {
          select: { fullName: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const data = students.map((s) => ({
    id: s.id,
    sapId: s.sapId,
    fullName: s.fullName,
    section: s.section,
    semester: s.semester,
    isPaid: s.isPaid,
    isActive: s.isActive,
    profilePhotoUrl: s.profilePhotoUrl,
    managerName: s.createdBy?.fullName || "System",
  }));

  return {
    data,
    total,
    pageCount: Math.ceil(total / safeLimit),
  };
}

// ============================================
// GET STUDENT PROFILE (Detailed)
// ============================================

export async function getStudentProfile(userId: string) {
  await requireSuperAdmin();

  const student = await prisma.user.findUnique({
    where: { id: userId, role: "STUDENT" },
    include: {
      createdBy: {
        select: { id: true, fullName: true, role: true, sapId: true },
      },
      accessLogs: {
        orderBy: { timestamp: "desc" },
        take: 50,
        include: {
          scanner: {
            select: { fullName: true, role: true },
          },
        },
      },
    },
  });

  return student;
}

// ============================================
// MANUAL PAYMENT OVERRIDE
// ============================================

/**
 * Manually mark a student as paid.
 * Used for emergency "Cash on Hand" scenarios at the Admin Desk.
 */
export async function manualPaymentOverride(
  userId: string
): Promise<ActionResult> {
  try {
    const adminId = await requireSuperAdmin();

    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    // Verify target is a student
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, fullName: true, sapId: true, isPaid: true },
    });

    if (!student) {
      return { success: false, message: "Student not found" };
    }

    if (student.role !== "STUDENT") {
      return { success: false, message: "Can only mark students as paid" };
    }

    if (student.isPaid) {
      return { success: false, message: "Student is already marked as paid" };
    }

    // Update payment status
    await prisma.user.update({
      where: { id: userId },
      data: { isPaid: true },
    });

    // Log the action (important for financial audit)
    await prisma.auditLog.create({
      data: {
        performerId: adminId,
        action: "MANUAL_PAYMENT",
        targetId: userId,
        details: `Manual payment override for ${student.sapId} (${
          student.fullName || "Unknown"
        }) - Cash on Hand`,
      },
    });

    revalidatePath("/admin/students");

    return {
      success: true,
      message: `Payment marked for ${student.sapId}`,
    };
  } catch (error) {
    console.error("Manual Payment Override Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to mark payment",
    };
  }
}

// ============================================
// MANUAL CHECK-IN (Emergency Override)
// ============================================

/**
 * Manually check-in a student when scanner fails or phone unavailable.
 * Creates an ENTRY access log with "Manual Override" note.
 */
export async function manualCheckIn(studentId: string): Promise<ActionResult> {
  try {
    const adminId = await requireSuperAdmin();

    if (!studentId) {
      return { success: false, message: "Student ID is required" };
    }

    // Verify target is a student
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true, fullName: true, sapId: true, isActive: true },
    });

    if (!student) {
      return { success: false, message: "Student not found" };
    }

    if (student.role !== "STUDENT") {
      return { success: false, message: "Target user is not a student" };
    }

    if (!student.isActive) {
      return { success: false, message: "Student access is revoked" };
    }

    // Check if student is already inside (has recent ENTRY without EXIT)
    const lastLog = await prisma.accessLog.findFirst({
      where: { userId: studentId },
      orderBy: { timestamp: "desc" },
    });

    if (lastLog && lastLog.type === "ENTRY") {
      return {
        success: false,
        message: "Student is already checked in",
      };
    }

    // Create ENTRY access log
    await prisma.accessLog.create({
      data: {
        userId: studentId,
        type: "ENTRY",
        status: "GRANTED",
        metadata: { source: "Manual Override - Admin Check-In" },
        scannerId: adminId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        performerId: adminId,
        action: "MANUAL_CHECKIN",
        targetId: studentId,
        details: `Manual check-in for ${student.sapId} (${
          student.fullName || "Unknown"
        })`,
      },
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/live");

    return {
      success: true,
      message: `${student.fullName || student.sapId} checked in successfully`,
    };
  } catch (error) {
    console.error("Manual Check-In Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to check in student",
    };
  }
}

// ============================================
// EXPORT ATTENDEES CSV
// ============================================

export interface AttendeeExport {
  sapId: string;
  fullName: string;
  gender: string;
  section: string;
  semester: string;
  entryTime: string;
}

/**
 * Get all students currently inside the venue (ENTRY with no subsequent EXIT).
 * Returns data formatted for CSV export.
 */
export async function getAttendeesForExport(): Promise<{
  success: boolean;
  data: AttendeeExport[];
  message?: string;
}> {
  try {
    await requireSuperAdmin();

    // Get today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all students with ENTRY logs today
    const studentsWithEntry = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        accessLogs: {
          some: {
            type: "ENTRY",
            timestamp: {
              gte: today,
              lt: tomorrow,
            },
          },
        },
      },
      select: {
        sapId: true,
        fullName: true,
        gender: true,
        section: true,
        semester: true,
        accessLogs: {
          where: {
            timestamp: {
              gte: today,
              lt: tomorrow,
            },
          },
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    // Filter to only those whose LAST log is ENTRY (currently inside)
    const attendees: AttendeeExport[] = studentsWithEntry
      .filter(
        (s) => s.accessLogs.length > 0 && s.accessLogs[0].type === "ENTRY"
      )
      .map((s) => ({
        sapId: s.sapId,
        fullName: s.fullName || "Unknown",
        gender: s.gender || "N/A",
        section: s.section || "N/A",
        semester: s.semester || "N/A",
        entryTime: s.accessLogs[0].timestamp.toLocaleTimeString("en-US", {
          hour12: true,
        }),
      }));

    return {
      success: true,
      data: attendees,
    };
  } catch (error) {
    console.error("Export Attendees Error:", error);
    return {
      success: false,
      data: [],
      message:
        error instanceof Error ? error.message : "Failed to export attendees",
    };
  }
}
