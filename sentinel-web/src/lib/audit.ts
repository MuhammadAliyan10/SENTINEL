"use server";

import { prisma } from "@/lib/prisma";

/**
 * SENTINEL AUDIT LOGGING UTILITY
 *
 * Crash-proof audit logging that never blocks user operations.
 * Handles edge cases like missing users (DB wipe) gracefully.
 *
 * GOLDEN RULE: Audit log failures should NEVER prevent user actions.
 */

export interface AuditLogParams {
  performerId: string;
  action: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Safely create an audit log entry.
 * Validates performer exists before creating log.
 * Returns success status - never throws.
 */
export async function safeAuditLog(params: AuditLogParams): Promise<boolean> {
  try {
    // Validate performer exists in database (prevents FK violation)
    const performerExists = await prisma.user.findUnique({
      where: { id: params.performerId },
      select: { id: true },
    });

    if (!performerExists) {
      console.warn(
        `[AUDIT] Skipped: Performer ${params.performerId} not found in database. ` +
          `Action: ${params.action}`
      );
      return false;
    }

    // Create the audit log
    await prisma.auditLog.create({
      data: {
        performerId: params.performerId,
        action: params.action,
        targetId: params.targetId,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    return true;
  } catch (error) {
    // Log error but don't throw - audit failures should never block operations
    console.error(
      `[AUDIT] Failed to create log for action "${params.action}":`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/**
 * Log a successful login attempt.
 * Uses safeAuditLog to prevent crashes.
 */
export async function logSuccessfulLoginSafe(
  userId: string,
  role: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  return safeAuditLog({
    performerId: userId,
    action: "LOGIN_SUCCESS",
    details: `${role} logged in successfully`,
    ipAddress,
    userAgent,
  });
}

/**
 * Log a failed login attempt for an authenticated user.
 * Only call this AFTER the user has been authenticated but failed role check.
 * For pre-auth failures, use console.warn instead (no performer ID).
 */
export async function logFailedLoginSafe(
  userId: string,
  reason: string,
  ipAddress?: string
): Promise<boolean> {
  return safeAuditLog({
    performerId: userId,
    action: "LOGIN_FAILED",
    details: reason,
    ipAddress,
  });
}

/**
 * Log an admin action (create, update, delete, etc.)
 */
export async function logAdminAction(
  performerId: string,
  action: string,
  targetId?: string,
  details?: string
): Promise<boolean> {
  return safeAuditLog({
    performerId,
    action,
    targetId,
    details,
  });
}
