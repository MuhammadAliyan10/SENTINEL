"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

// ============================================
// TYPES
// ============================================

export interface ManagerStats {
  cashCollected: number;
  totalPasses: number;
}

export interface LedgerEntry {
  id: string;
  sapId: string;
  fullName: string | null;
  createdAt: string;
  activationToken: string | null;
}

export interface IssuePassResult {
  success: boolean;
  message: string;
  token?: string;
  studentName?: string;
}

// ============================================
// HELPERS
// ============================================

async function getManagerId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, isActive: true },
  });

  if (
    !dbUser ||
    !dbUser.isActive ||
    (dbUser.role !== "CR" && dbUser.role !== "GR")
  ) {
    throw new Error("Unauthorized Manager Access");
  }

  return dbUser.id;
}

function generateToken(): string {
  // Generate a 6-character alphanumeric token (uppercase)
  // Avoiding ambiguous characters like I, l, 1, O, 0
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  const randomValues = randomBytes(6);

  for (let i = 0; i < 6; i++) {
    token += chars[randomValues[i] % chars.length];
  }

  return token;
}

// ============================================
// ACTIONS
// ============================================

import { getTicketPrice } from "@/actions/settings";

export async function getManagerStats() {
  const managerId = await getManagerId();
  const ticketPrice = await getTicketPrice();

  const count = await prisma.user.count({
    where: {
      createdById: managerId,
      role: "STUDENT",
    },
  });

  return {
    cashCollected: count * ticketPrice,
    totalPasses: count,
  };
}

export async function getManagerLedger(
  page: number = 1,
  limit: number = 10
): Promise<{ data: LedgerEntry[]; total: number; totalPages: number }> {
  const managerId = await getManagerId();
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        createdById: managerId,
        role: "STUDENT",
      },
      select: {
        id: true,
        sapId: true,
        activationToken: true,
        createdAt: true,
        // fullName is removed from select as per the instruction's provided code
        // If fullName is still needed, it should be added back here.
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
    }),
    prisma.user.count({
      where: {
        createdById: managerId,
        role: "STUDENT",
      },
    }),
  ]);

  return {
    data: data.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(), // Converts Date to string
      fullName: null, // fullName is not selected, so explicitly set to null or remove from LedgerEntry if not needed
    })),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function issuePass(sapId: string): Promise<IssuePassResult> {
  try {
    const managerId = await getManagerId();

    if (!sapId || !/^\d+$/.test(sapId)) {
      return { success: false, message: "Invalid SAP ID format" };
    }

    // 1. Check if student already exists (Global Check)
    const existingStudent = await prisma.user.findUnique({
      where: { sapId },
      include: { createdBy: true },
    });

    if (existingStudent) {
      const creatorName = existingStudent.createdBy?.fullName || "System";
      return {
        success: false,
        message: `Student already registered by ${creatorName}`,
      };
    }

    // 2. Generate Token
    const token = generateToken();

    // 3. Create Student
    const newStudent = await prisma.user.create({
      data: {
        sapId,
        role: "STUDENT",
        isPaid: true,
        isActive: true,
        createdById: managerId,
        activationToken: token,
        // Optional: We could fetch name from external API later if needed
        // For now, name is null until they complete profile
      },
    });

    revalidatePath("/manager/dashboard");

    return {
      success: true,
      message: "Pass issued successfully",
      token: token,
      studentName: newStudent.fullName || "Student",
    };
  } catch (error) {
    console.error("Issue Pass Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to issue pass",
    };
  }
}
