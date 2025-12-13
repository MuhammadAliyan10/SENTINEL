import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import {
  StudentsBySemesterChart,
  DepartmentDistributionChart,
  EntryVelocityChart,
  ManagerPerformanceChart,
} from "@/components/dashboard/AnalyticsChart";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  Users,
  DollarSign,
  UserCheck,
  Shield,
  Clock,
} from "lucide-react";

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
// DATA FETCHING
// ============================================

const getCachedStats = unstable_cache(
  async () => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [totalStudents, totalManagers, todayEntries, todayRejected] =
      await Promise.all([
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.user.count({ where: { role: { in: ["CR", "GR"] } } }),
        prisma.accessLog.count({
          where: {
            status: "GRANTED",
            timestamp: { gte: todayStart, lt: todayEnd },
          },
        }),
        prisma.accessLog.count({
          where: {
            status: "REJECTED",
            timestamp: { gte: todayStart, lt: todayEnd },
          },
        }),
      ]);

    return {
      totalStudents,
      totalManagers,
      totalRevenue: totalStudents * 2000,
      todayEntries,
      todayRejected,
    };
  },
  ["dashboard-stats"],
  { tags: ["dashboard-stats"], revalidate: 30 }
);

const getCachedAnalytics = unstable_cache(
  async () => {
    // Students by Semester
    const semesterCounts = await prisma.user.groupBy({
      by: ["semester"],
      where: { role: "STUDENT", semester: { not: null } },
      _count: { id: true },
      orderBy: { semester: "asc" },
    });

    type SemesterCount = { semester: string | null; _count: { id: number } };
    const semesterData = semesterCounts.map((s: SemesterCount) => ({
      semester: `Sem ${s.semester}`,
      count: s._count.id,
    }));

    // Students by Department
    const departmentCounts = await prisma.user.groupBy({
      by: ["department"],
      where: { role: "STUDENT", department: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    });

    type DeptCount = { department: string | null; _count: { id: number } };
    const departmentData = departmentCounts.map((d: DeptCount) => ({
      department: d.department || "Other",
      count: d._count.id,
      paid: d._count.id, // All registered = paid
    }));

    // Top managers
    const managerStats = await prisma.user.groupBy({
      by: ["createdById"],
      where: { role: "STUDENT", createdById: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const managerIds = managerStats
      .map((m: { createdById: string | null }) => m.createdById)
      .filter(Boolean) as string[];

    const managers = await prisma.user.findMany({
      where: { id: { in: managerIds } },
      select: { id: true, fullName: true, sapId: true },
    });

    type ManagerStat = { createdById: string | null; _count: { id: number } };
    const managerData = managerStats.map((m: ManagerStat) => {
      const manager = managers.find((mgr) => mgr.id === m.createdById);
      return {
        name: manager?.fullName?.split(" ")[0] || manager?.sapId || "Unknown",
        registrations: m._count.id,
        revenue: m._count.id * 2000,
      };
    });

    return { semesterData, departmentData, managerData };
  },
  ["dashboard-analytics"],
  { tags: ["dashboard-analytics"], revalidate: 60 }
);

async function getRecentLogs(limit: number = 50) {
  return prisma.accessLog.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      status: true,
      gateNumber: true,
      user: { select: { sapId: true, fullName: true } },
    },
  });
}

// ============================================
// SKELETONS
// ============================================

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-80" />;
}

// ============================================
// ASYNC COMPONENTS
// ============================================

async function OverviewStats() {
  const data = await getCachedStats();

  const stats = [
    {
      title: "Total Revenue",
      value: `Rs. ${data.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      iconColor: "text-emerald-600",
    },
    {
      title: "Students Registered",
      value: data.totalStudents.toLocaleString(),
      icon: Users,
      iconColor: "text-primary",
    },
    {
      title: "Active Managers",
      value: data.totalManagers,
      icon: UserCheck,
      iconColor: "text-blue-600",
    },
    {
      title: "Today's Entries",
      value: data.todayEntries.toLocaleString(),
      icon: Clock,
      iconColor: "text-amber-600",
    },
  ];

  return <StatsGrid stats={stats} />;
}

async function AnalyticsCharts() {
  const { semesterData, departmentData, managerData } =
    await getCachedAnalytics();

  // Mock hourly data for entry velocity
  const hourlyData = [
    { hour: "6AM", entries: 45, exits: 0 },
    { hour: "8AM", entries: 280, exits: 25 },
    { hour: "10AM", entries: 80, exits: 35 },
    { hour: "12PM", entries: 35, exits: 120 },
    { hour: "2PM", entries: 60, exits: 95 },
    { hour: "4PM", entries: 25, exits: 200 },
  ];

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StudentsBySemesterChart data={semesterData} />
        <DepartmentDistributionChart data={departmentData} />
      </div>

      {/* Row 2 */}
      <EntryVelocityChart data={hourlyData} showExits={true} />

      {/* Row 3 */}
      {managerData.length > 0 && <ManagerPerformanceChart data={managerData} />}
    </div>
  );
}

async function ActivityLogs({ limit }: { limit: number }) {
  const logs = await getRecentLogs(limit);
  return <RecentActivityList logs={logs} limit={limit} showFilters={true} />;
}

// ============================================
// PAGE
// ============================================

export default async function AdminDashboard() {
  await verifyAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of campus access and registrations."
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
            value="analytics"
            className="relative gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="relative gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Activity className="h-4 w-4" /> Recent Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview - Stats Cards */}
        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<StatsSkeleton />}>
            <OverviewStats />
          </Suspense>
        </TabsContent>

        {/* Analytics - Charts */}
        <TabsContent value="analytics" className="space-y-6">
          <Suspense fallback={<ChartSkeleton />}>
            <AnalyticsCharts />
          </Suspense>
        </TabsContent>

        {/* Activity - Logs Table */}
        <TabsContent value="activity">
          <Suspense fallback={<ChartSkeleton />}>
            <ActivityLogs limit={50} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
