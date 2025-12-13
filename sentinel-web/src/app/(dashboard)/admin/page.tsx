import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { LayoutDashboard, BarChart3, Activity } from "lucide-react";

// Actions
import {
  getDashboardStats,
  getTrafficData,
  getPaymentLeaderboard,
  getManagerLiability,
} from "@/actions/dashboard-actions";

// Components
import { KPIGrid } from "@/components/features/admin/dashboard/KPIGrid";
import { TrafficChart } from "@/components/features/admin/dashboard/TrafficChart";
import { PaymentLeaderboard } from "@/components/features/admin/dashboard/PaymentLeaderboard";
import { ManagerLiabilityTable } from "@/components/features/admin/dashboard/ManagerLiabilityTable";
import { LiveFeed } from "@/components/features/admin/dashboard/LiveFeed";
import { RecentActivityList } from "@/components/features/admin/dashboard/RecentActivityList";

// Legacy Analytics (Keep for Analytics Tab)
import {
  StudentsBySemesterChart,
  DepartmentDistributionChart,
  EntryVelocityChart,
  ManagerPerformanceChart,
} from "@/components/features/admin/dashboard/AnalyticsChart";

export const dynamic = "force-dynamic";

// ============================================
// AUTH
// ============================================

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }
}

// ============================================
// SKELETONS
// ============================================

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-[350px]" />;
}

// ============================================
// DATA FETCHING WRAPPERS
// ============================================

async function WarRoomOverview() {
  const [stats, traffic, leaderboard, liability] = await Promise.all([
    getDashboardStats(),
    getTrafficData(),
    getPaymentLeaderboard(),
    getManagerLiability(),
  ]);

  return (
    <div className="space-y-6">
      {/* Row 1: The Pulse */}
      <KPIGrid data={stats} />

      {/* Row 2: The Deep Dive */}
      <div className="grid gap-6 md:grid-cols-2">
        <TrafficChart data={traffic} />
        <PaymentLeaderboard data={leaderboard} />
      </div>

      {/* Row 3: The Action */}
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <ManagerLiabilityTable data={liability} />
        </div>
        <div className="md:col-span-2">
          <LiveFeed />
        </div>
      </div>
    </div>
  );
}

async function ActivityLogs() {
  // Fetch logs directly here or use a helper
  const logs = await prisma.accessLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 50,
    select: {
      id: true,
      timestamp: true,
      status: true,
      gateNumber: true,
      user: { select: { sapId: true, fullName: true } },
    },
  });
  return <RecentActivityList logs={logs} limit={50} showFilters={true} />;
}

// ============================================
// PAGE
// ============================================

export default async function AdminDashboard() {
  await verifyAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="War Room"
        description="Real-time operational command center."
      />

      <Tabs defaultValue="overview" className="flex h-full flex-col">
        <TabsList className="mb-6 h-auto w-full rounded-none justify-start gap-6 border-b bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="relative gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <LayoutDashboard className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="relative gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Activity className="h-4 w-4" /> Recent Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview - War Room */}
        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<StatsSkeleton />}>
            <WarRoomOverview />
          </Suspense>
        </TabsContent>

        {/* Activity - Logs Table */}
        <TabsContent value="activity">
          <Suspense fallback={<ChartSkeleton />}>
            <ActivityLogs />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
