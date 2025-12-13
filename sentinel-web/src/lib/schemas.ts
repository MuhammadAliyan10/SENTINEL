import { z } from "zod";

/**
 * Validation Schemas for Admin Module
 * Using Zod for runtime type validation in Server Actions
 */

// ============================================
// MANAGER SCHEMAS
// ============================================

export const createManagerSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name too long"),
  semester: z.string().min(1, "Semester is required"),
  section: z.string().min(1, "Section is required"),
  role: z.enum(["CR", "GR"], {
    message: "Role must be CR or GR",
  }),
  gender: z.enum(["MALE", "FEMALE"], {
    message: "Gender is required",
  }),
});

export type CreateManagerInput = z.infer<typeof createManagerSchema>;

// ============================================
// STUDENT SEARCH SCHEMA
// ============================================

export const searchStudentSchema = z.object({
  sapId: z.string().regex(/^\d{8}$/, "SAP ID must be exactly 8 digits"),
});

export type SearchStudentInput = z.infer<typeof searchStudentSchema>;

// ============================================
// REVOKE ACCESS SCHEMA
// ============================================

export const revokeAccessSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
});

export type RevokeAccessInput = z.infer<typeof revokeAccessSchema>;
