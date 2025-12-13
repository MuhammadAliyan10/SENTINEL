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

import { getTicketPrice } from "@/actions/settings-actions";

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

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ...

export async function issuePass(sapId: string): Promise<IssuePassResult> {
  try {
    const managerId = await getManagerId();

    if (!sapId || !/^\d+$/.test(sapId)) {
      return { success: false, message: "Invalid SAP ID format" };
    }

    // Get manager's section and semester to inherit
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { section: true, semester: true },
    });

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

    // 3. Create Supabase Auth User (Admin)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: `${sapId}@sentinel.edu`,
        password: token, // Token is the initial password
        email_confirm: true,
        user_metadata: { sapId, role: "STUDENT" },
      });

    if (authError || !authUser.user) {
      console.error("Supabase Auth Error:", authError);
      throw new Error("Failed to create authentication record");
    }

    // 4. Create Prisma User (Linked by ID, inherit manager's class)
    try {
      const newStudent = await prisma.user.create({
        data: {
          id: authUser.user.id, // Link to Supabase Auth ID
          sapId,
          role: "STUDENT",
          isPaid: true,
          isActive: true,
          createdById: managerId,
          activationToken: token,
          // Inherit class from manager
          section: manager?.section || null,
          semester: manager?.semester || null,
        },
      });

      revalidatePath("/manager/dashboard");

      return {
        success: true,
        message: "Pass issued successfully",
        token: token,
        studentName: newStudent.fullName || "Student",
      };
    } catch (dbError) {
      // ROLLBACK: Delete the Auth user if DB fails (e.g. duplicate SAP ID race condition)
      console.error("DB Creation Failed. Rolling back Auth User:", dbError);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error("Student already exists. Operation rolled back.");
    }
  } catch (error) {
    console.error("Issue Pass Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to issue pass",
    };
  }
}
