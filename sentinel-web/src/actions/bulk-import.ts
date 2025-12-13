"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/actions/auth-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CSVStudentRow, BulkImportResult } from "@/types/database";
import { randomBytes } from "crypto";

// Maximum rows allowed per import (prevent DoS)
const MAX_IMPORT_ROWS = 500;

/**
 * Validate SAP ID format (8 digits)
 */
function isValidSapId(sapId: string): boolean {
  return /^[0-9]{8}$/.test(sapId);
}

/**
 * Generate a secure 6-character activation token
 * Avoiding ambiguous characters like I, l, 1, O, 0
 */
function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  const randomValues = randomBytes(6);

  for (let i = 0; i < 6; i++) {
    token += chars[randomValues[i] % chars.length];
  }

  return token;
}

/**
 * Sanitize user input to prevent XSS
 * Removes HTML tags, script content, and dangerous characters
 */
function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers like onclick=
    .replace(/[<>"'`]/g, ""); // Remove potentially dangerous chars
}

interface ProcessedStudent {
  sapId: string;
  fullName: string;
  email: string;
  isPaid: boolean;
  activationToken: string;
  section?: string;
  semester?: string;
}

/**
 * Process and validate CSV data
 */
function processCSVData(rows: CSVStudentRow[]): {
  valid: ProcessedStudent[];
  errors: string[];
} {
  const valid: ProcessedStudent[] = [];
  const errors: string[] = [];
  const seenSapIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because index is 0-based and we skip header

    // Validate SAP ID
    if (!row.sap_id || !row.sap_id.trim()) {
      errors.push(`Row ${rowNum}: Missing SAP ID`);
      return;
    }

    const sapId = row.sap_id.trim();

    if (!isValidSapId(sapId)) {
      errors.push(
        `Row ${rowNum}: Invalid SAP ID format "${sapId}" (must be 8 digits)`
      );
      return;
    }

    // Check for duplicates within the CSV
    if (seenSapIds.has(sapId)) {
      errors.push(`Row ${rowNum}: Duplicate SAP ID "${sapId}" in CSV`);
      return;
    }
    seenSapIds.add(sapId);

    // Validate full name
    if (!row.full_name || row.full_name.trim().length < 2) {
      errors.push(`Row ${rowNum}: Missing or invalid full name`);
      return;
    }

    // Process payment status
    let isPaid = false;
    if (row.payment_status !== undefined) {
      if (typeof row.payment_status === "boolean") {
        isPaid = row.payment_status;
      } else {
        const statusStr = row.payment_status.toString().toLowerCase().trim();
        isPaid = ["true", "yes", "1", "paid"].includes(statusStr);
      }
    }

    // Generate activation token
    const activationToken = generateToken();

    valid.push({
      sapId,
      fullName: sanitizeName(row.full_name),
      email: row.email?.trim() || `${sapId}@student.sentinel.edu`,
      isPaid,
      activationToken,
      section: row.section?.trim(),
      semester: row.semester?.trim(),
    });
  });

  return { valid, errors };
}

/**
 * Server Action: Import multiple students from CSV
 * SECURED: Requires SUPER_ADMIN authentication
 * FIXED: Actually persists data to database
 */
export async function importStudents(
  csvRows: CSVStudentRow[]
): Promise<BulkImportResult> {
  try {
    // ============================================
    // AUTHORIZATION CHECK
    // ============================================
    const admin = await requireSuperAdmin();

    // ============================================
    // INPUT VALIDATION
    // ============================================
    if (!csvRows || csvRows.length === 0) {
      return {
        success: false,
        message: "No data to import",
        imported: 0,
        failed: 0,
        errors: ["CSV file is empty or invalid"],
      };
    }

    if (csvRows.length > MAX_IMPORT_ROWS) {
      return {
        success: false,
        message: `Maximum ${MAX_IMPORT_ROWS} rows allowed per import`,
        imported: 0,
        failed: csvRows.length,
        errors: [
          `File contains ${csvRows.length} rows, max is ${MAX_IMPORT_ROWS}`,
        ],
      };
    }

    // Process and validate the data
    const { valid, errors } = processCSVData(csvRows);

    if (valid.length === 0) {
      return {
        success: false,
        message: "No valid records to import",
        imported: 0,
        failed: csvRows.length,
        errors,
      };
    }

    // ============================================
    // CHECK FOR EXISTING SAP IDs
    // ============================================
    const sapIds = valid.map((s) => s.sapId);
    const existingUsers = await prisma.user.findMany({
      where: { sapId: { in: sapIds } },
      select: { sapId: true },
    });

    const existingSapIds = new Set(existingUsers.map((u) => u.sapId));

    const toInsert = valid.filter((s) => {
      if (existingSapIds.has(s.sapId)) {
        errors.push(`SAP ID ${s.sapId} already exists in database`);
        return false;
      }
      return true;
    });

    if (toInsert.length === 0) {
      return {
        success: false,
        message: "All SAP IDs already exist in the database",
        imported: 0,
        failed: valid.length,
        errors,
      };
    }

    // ============================================
    // CREATE USERS (Supabase Auth + Prisma)
    // ============================================
    const supabaseAdmin = createAdminClient();
    let successCount = 0;

    for (const student of toInsert) {
      try {
        // 1. Create Supabase Auth user
        const { data: authUser, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: student.email,
            password: student.activationToken, // Token is initial password
            email_confirm: true,
            user_metadata: {
              sapId: student.sapId,
              role: "STUDENT",
            },
          });

        if (authError || !authUser.user) {
          errors.push(
            `${student.sapId}: Auth creation failed - ${authError?.message}`
          );
          continue;
        }

        // 2. Create Prisma User record
        try {
          await prisma.user.create({
            data: {
              id: authUser.user.id,
              sapId: student.sapId,
              fullName: student.fullName,
              role: "STUDENT",
              isPaid: student.isPaid,
              isActive: true,
              activationToken: student.activationToken,
              section: student.section || null,
              semester: student.semester || null,
              createdById: admin.id,
            },
          });
          successCount++;
        } catch (dbError) {
          // Rollback: Delete auth user if DB insert fails
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
          errors.push(`${student.sapId}: Database insert failed`);
        }
      } catch (err) {
        errors.push(
          `${student.sapId}: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }

    // ============================================
    // LOG THE IMPORT
    // ============================================
    await prisma.auditLog.create({
      data: {
        performerId: admin.id,
        action: "BULK_IMPORT",
        details: `Imported ${successCount} students from CSV. Failed: ${errors.length}`,
      },
    });

    revalidatePath("/admin/students");

    return {
      success: successCount > 0,
      message: `Successfully imported ${successCount} students`,
      imported: successCount,
      failed: errors.length,
      errors: errors.slice(0, 20), // Limit errors returned
    };
  } catch (error) {
    console.error("Bulk import error:", error);

    if (error instanceof Error && error.message.includes("required")) {
      return {
        success: false,
        message: error.message,
        imported: 0,
        failed: csvRows.length,
        errors: [error.message],
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Import failed",
      imported: 0,
      failed: csvRows.length,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Server Action: Validate CSV without importing
 * SECURED: Requires SUPER_ADMIN authentication
 */
export async function validateCSV(csvRows: CSVStudentRow[]): Promise<{
  valid: number;
  invalid: number;
  errors: string[];
}> {
  try {
    // Authorization check
    await requireSuperAdmin();

    // Rate limit check
    if (csvRows.length > MAX_IMPORT_ROWS) {
      return {
        valid: 0,
        invalid: csvRows.length,
        errors: [`Maximum ${MAX_IMPORT_ROWS} rows allowed`],
      };
    }

    // Validate without generating secrets
    const { valid, errors } = processCSVData(csvRows);

    // Check for existing SAP IDs
    const sapIds = valid.map((s) => s.sapId);
    const existingUsers = await prisma.user.findMany({
      where: { sapId: { in: sapIds } },
      select: { sapId: true },
    });

    const existingSapIds = new Set(existingUsers.map((u) => u.sapId));
    const additionalErrors = [...existingSapIds].map(
      (id) => `SAP ID ${id} already exists`
    );

    return {
      valid: valid.length - existingSapIds.size,
      invalid: errors.length + existingSapIds.size,
      errors: [...errors, ...additionalErrors].slice(0, 20),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return {
        valid: 0,
        invalid: csvRows.length,
        errors: [error.message],
      };
    }

    return {
      valid: 0,
      invalid: csvRows.length,
      errors: ["Validation failed"],
    };
  }
}
