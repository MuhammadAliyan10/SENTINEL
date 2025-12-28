import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/actions/auth-actions";
import { Skeleton } from "@/components/ui/skeleton";

// Components
import { StatCard } from "@/components/features/admin/dashboard/StatCard";
import { TrafficChart } from "@/components/features/admin/dashboard/TrafficChart";
import { LiveFeed } from "@/components/features/admin/dashboard/LiveFeed";
import { ActivityTable } from "@/components/features/admin/dashboard/ActivityTable";

export const dynamic = "force-dynamic";

// ============================================
// DATA FETCHING
// ============================================

async function getDashboardData() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Get event settings (active event by isDefault flag)
  const [event, ticketPrice] = await Promise.all([
    prisma.event.findFirst({
      where: { isDefault: true },
      select: { maxCapacity: true, ticketPrice: true },
    }),
    // Use centralized getTicketPrice for consistency
    (async () => {
      const { getTicketPrice } = await import("@/actions/settings-actions");
      return getTicketPrice();
    })(),
  ]);

  const maxCapacity = event?.maxCapacity || 800;

  // Parallel queries for performance
  const [
    liveOccupancy,
    totalScansToday,
    securityAlerts,
    paidCount,
    hourlyTraffic,
    liveScans,
    activityLogs,
    activityTotal,
  ] = await Promise.all([
    // Live occupancy: entries - exits today
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'ENTRY' THEN 1 ELSE -1 END), 0) as count
      FROM "access_logs"
      WHERE timestamp >= ${todayStart}
    `.then((r) => Number(r[0]?.count || 0)),

    // Total scans today
    prisma.accessLog.count({
      where: { timestamp: { gte: todayStart } },
    }),

    // Security alerts (rejected/duplicate)
    prisma.accessLog.count({
      where: {
        timestamp: { gte: todayStart },
        status: { in: ["REJECTED", "DUPLICATE"] },
      },
    }),

    // Paid students count
    prisma.user.count({
      where: { role: "STUDENT", isPaid: true },
    }),

    // ================================================================
    // HOURLY TRAFFIC (ALL 24 HOURS - 1-HOUR GRANULARITY)
    // ================================================================
    // OLD: Only last 12 hours with 12-hour format (e.g., "01 AM", "02 PM")
    //      This caused gaps and made it look like 3-hour blocks
    // NEW: All 24 hours of today with 24-hour format (e.g., "00:00", "14:00")
    //
    // This provides high-resolution traffic data for accurate peak identification
    // and efficient guard deployment planning.
    (async () => {
      // Fetch all entries for today
      const logs = await prisma.accessLog.findMany({
        where: {
          timestamp: { gte: todayStart },
          type: "ENTRY",
          status: "GRANTED",
        },
        select: {
          timestamp: true,
        },
      });

      // Create a map for all 24 hours (0-23), initialized to 0
      const hourlyMap = new Map<number, number>();
      for (let hour = 0; hour < 24; hour++) {
        hourlyMap.set(hour, 0);
      }

      // Count entries per hour
      logs.forEach((log) => {
        const hour = log.timestamp.getHours();
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
      });

      // Convert to array with formatted hour labels
      return Array.from(hourlyMap.entries()).map(([hour, entries]) => ({
        hour: `${String(hour).padStart(2, "0")}:00`, // 24-hour format
        entries,
      }));
    })(),

    // Live scans (last 5)
    prisma.accessLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 5,
      select: {
        id: true,
        timestamp: true,
        status: true,
        type: true,
        user: {
          select: {
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
    }),

    // Activity logs (first page)
    prisma.accessLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 10,
      select: {
        id: true,
        timestamp: true,
        status: true,
        type: true,
        gateNumber: true,
        user: {
          select: {
            fullName: true,
            sapId: true,
            role: true,
            profilePhotoUrl: true,
          },
        },
      },
    }),

    // Total activity count
    prisma.accessLog.count(),
  ]);

  const revenue = paidCount * ticketPrice;

  return {
    stats: {
      liveOccupancy,
      maxCapacity,
      totalScansToday,
      securityAlerts,
      revenue,
    },
    hourlyTraffic, // NEW: No mapping needed, already in correct format
    liveScans,
    activityLogs,
    activityTotal,
  };
}

// ============================================
// SKELETONS
// ============================================

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-[380px] rounded-xl" />;
}

// ============================================
// COMMAND CENTER
// ============================================

async function CommandCenter() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Zone 1: The Pulse - Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Capacity"
          value={data.stats.liveOccupancy}
          iconName="Users"
          progress={{
            current: data.stats.liveOccupancy,
            max: data.stats.maxCapacity,
          }}
        />
        <StatCard
          title="Total Scans Today"
          value={data.stats.totalScansToday}
          iconName="Activity"
          trend="up"
          trendValue="Live"
        />
        <StatCard
          title="Security Issues"
          value={data.stats.securityAlerts}
          iconName="AlertTriangle"
          valueColor={
            data.stats.securityAlerts > 0 ? "text-red-600" : undefined
          }
        />
        <StatCard
          title="Est. Revenue"
          value={`PKR ${(data.stats.revenue / 1000).toFixed(0)}K`}
          iconName="DollarSign"
          trend="up"
          trendValue="Collected"
        />
      </div>

      {/* Zone 2 & 3: Flow + Watchtower */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrafficChart data={data.hourlyTraffic} />
        </div>
        <div>
          <LiveFeed initialData={data.liveScans} />
        </div>
      </div>

      {/* Zone 4: Deep Dive */}
      <ActivityTable
        initialData={data.activityLogs}
        totalCount={data.activityTotal}
      />
    </div>
  );
}

// ============================================
// PAGE
// ============================================

export default async function AdminDashboard() {
  await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-slate-50 -m-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Command Center</h1>
        <p className="text-slate-500 mt-1">Real-time operational dashboard</p>
      </div>

      {/* Dashboard Content */}
      <Suspense fallback={<StatsSkeleton />}>
        <CommandCenter />
      </Suspense>
    </div>
  );
}
