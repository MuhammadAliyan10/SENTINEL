"use server";

import { authenticator } from "otplib";
import { revalidatePath } from "next/cache";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import type {
  ProcessedStudent,
  BulkImportResult,
  CSVStudentRow,
} from "@/types/database";

// Configure TOTP authenticator
authenticator.options = {
  digits: 6,
  step: 30,
  window: 1,
};

// Maximum rows allowed per import
const MAX_IMPORT_ROWS = 2000;

/**
 * Validate SAP ID format (8 digits)
 */
function isValidSapId(sapId: string): boolean {
  return /^[0-9]{8}$/.test(sapId);
}

/**
 * Generate a unique TOTP secret
 */
function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Validate CSV data without generating secrets
 * Used for preview/dry-run
 */
function validateCSVData(rows: CSVStudentRow[]): {
  validCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  const seenSapIds = new Set<string>();
  let validCount = 0;

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

    validCount++;
  });

  return { validCount, errors };
}

/**
 * Process CSV data and generate TOTP secrets
 * Only called during actual import
 */
function processCSVData(rows: CSVStudentRow[]): {
  valid: ProcessedStudent[];
  errors: string[];
} {
  const valid: ProcessedStudent[] = [];
  const errors: string[] = [];
  const seenSapIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2;

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

    if (seenSapIds.has(sapId)) {
      errors.push(`Row ${rowNum}: Duplicate SAP ID "${sapId}" in CSV`);
      return;
    }
    seenSapIds.add(sapId);

    if (!row.full_name || row.full_name.trim().length < 2) {
      errors.push(`Row ${rowNum}: Missing or invalid full name`);
      return;
    }

    // Process payment status
    let paymentStatus = false;
    if (row.payment_status !== undefined) {
      if (typeof row.payment_status === "boolean") {
        paymentStatus = row.payment_status;
      } else {
        const statusStr = row.payment_status.toString().toLowerCase().trim();
        paymentStatus = ["true", "yes", "1", "paid"].includes(statusStr);
      }
    }

    // Generate TOTP secret ONLY during actual import
    const totpSecret = generateTotpSecret();

    valid.push({
      sap_id: sapId,
      // Sanitize full name to prevent XSS
      full_name: row.full_name.trim().replace(/[<>]/g, ""),
      email: row.email?.trim() || `${sapId}@student.university.edu`,
      payment_status: paymentStatus,
      totp_secret: totpSecret,
    });
  });

  return { valid, errors };
}

/**
 * Server Action: Import multiple students from CSV
 * SECURED: Requires admin authentication
 */
export async function importStudents(
  csvRows: CSVStudentRow[]
): Promise<BulkImportResult> {
  try {
    // ============================================
    // AUTHORIZATION CHECK
    // ============================================
    await requireAdmin();

    // ============================================
    // RATE LIMITING CHECK
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

    // Process and validate the data (with TOTP generation)
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

    const supabase = await createClient();

    // ============================================
    // CHECK FOR EXISTING SAP IDs
    // ============================================
    const sapIds = valid.map((s) => s.sap_id);
    const { data: existingProfiles } = (await supabase
      .from("profiles")
      .select("sap_id")
      .in("sap_id", sapIds)) as { data: { sap_id: string }[] | null };

    const existingSapIds = new Set(
      existingProfiles?.map((p) => p.sap_id) || []
    );

    const toInsert = valid.filter((s) => {
      if (existingSapIds.has(s.sap_id)) {
        errors.push(`SAP ID ${s.sap_id} already exists in database`);
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
    // BATCH INSERT
    // ============================================
    // TODO: In production, create auth users first, then update profiles
    // For now, we simulate the insert

    // Example Supabase insert:
    // const { error: insertError } = await supabase
    //   .from("profiles")
    //   .insert(toInsert.map(s => ({
    //     id: crypto.randomUUID(), // In production, this comes from auth
    //     sap_id: s.sap_id,
    //     full_name: s.full_name,
    //     totp_secret: s.totp_secret,
    //     payment_status: s.payment_status,
    //     role: "student",
    //   })));
    //
    // if (insertError) throw insertError;

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    revalidatePath("/admin/students");

    return {
      success: true,
      message: `Successfully imported ${toInsert.length} students`,
      imported: toInsert.length,
      failed: errors.length,
      errors: errors.slice(0, 10),
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
 * SECURED: Requires admin authentication
 */
export async function validateCSV(csvRows: CSVStudentRow[]): Promise<{
  valid: number;
  invalid: number;
  errors: string[];
}> {
  try {
    // Authorization check
    await requireAdmin();

    // Rate limit check
    if (csvRows.length > MAX_IMPORT_ROWS) {
      return {
        valid: 0,
        invalid: csvRows.length,
        errors: [`Maximum ${MAX_IMPORT_ROWS} rows allowed`],
      };
    }

    // Validate without generating secrets
    const { validCount, errors } = validateCSVData(csvRows);

    return {
      valid: validCount,
      invalid: errors.length,
      errors: errors.slice(0, 20),
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
