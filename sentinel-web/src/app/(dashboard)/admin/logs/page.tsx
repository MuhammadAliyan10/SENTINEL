import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/actions/auth-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Components
import { AuditStats } from "@/components/features/admin/audit/AuditStats";
import { SystemLogsClient } from "@/components/features/admin/audit/SystemLogsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// ============================================
// DATA FETCHING
// ============================================

async function getAuditStats() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const HIGH_RISK_ACTIONS = [
    "DELETE_MANAGER",
    "REVOKE_ACCESS",
    "MANUAL_PAYMENT",
    "MANUAL_CHECKIN",
    "FREEZE_MANAGER",
  ];

  const [totalActions24h, highRiskActions, uniqueAdmins] = await Promise.all([
    prisma.auditLog.count({
      where: { timestamp: { gte: yesterday } },
    }),
    prisma.auditLog.count({
      where: {
        timestamp: { gte: yesterday },
        action: { in: HIGH_RISK_ACTIONS },
      },
    }),
    prisma.auditLog
      .groupBy({
        by: ["performerId"],
        where: { timestamp: { gte: todayStart } },
      })
      .then((result) => result.length),
  ]);

  return { totalActions24h, highRiskActions, uniqueAdmins };
}

async function getInitialLogs() {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 20,
      select: {
        id: true,
        timestamp: true,
        action: true,
        targetId: true,
        details: true,
        ipAddress: true,
        performer: {
          select: {
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
    }),
    prisma.auditLog.count(),
  ]);

  return { logs, total };
}

// ============================================
// LOADING SKELETON
// ============================================

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

// ============================================
// SERVER COMPONENT
// ============================================

async function AuditDashboard() {
  const [stats, initialLogs] = await Promise.all([
    getAuditStats(),
    getInitialLogs(),
  ]);

  return (
    <div className="space-y-6">
      <AuditStats
        totalActions24h={stats.totalActions24h}
        highRiskActions={stats.highRiskActions}
        uniqueAdmins={stats.uniqueAdmins}
      />
      <Card className="bg-white border-border shadow-sm">
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed log of all system activities
          </p>
        </CardHeader>
        <CardContent>
          <SystemLogsClient
            initialLogs={initialLogs.logs}
            initialTotal={initialLogs.total}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// PAGE
// ============================================

export default async function SystemLogsPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Logs</h1>
          <p className="text-muted-foreground mt-1">
            Immutable history of all administrative actions
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Content */}
      <Suspense fallback={<StatsSkeleton />}>
        <AuditDashboard />
      </Suspense>
    </div>
  );
}
