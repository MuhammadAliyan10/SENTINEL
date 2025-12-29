"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/actions/auth-actions";

// ============================================
// EXPORT AUDIT LOGS (for CSV download)
// ============================================

export interface AuditLogExportRow {
  timestamp: string;
  action: string;
  performerName: string;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
}

export async function getAllAuditLogsForExport(): Promise<{
  success: boolean;
  data: AuditLogExportRow[];
  message?: string;
}> {
  try {
    await requireSuperAdmin();

    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 10000, // Reasonable limit for CSV
      select: {
        timestamp: true,
        action: true,
        targetId: true,
        details: true,
        ipAddress: true,
        performer: {
          select: { fullName: true },
        },
      },
    });

    const exportData: AuditLogExportRow[] = logs.map((log) => ({
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      performerName: log.performer?.fullName || "System",
      targetId: log.targetId,
      details: log.details,
      ipAddress: log.ipAddress,
    }));

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    console.error("Export Audit Logs Error:", error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Export failed",
    };
  }
}
