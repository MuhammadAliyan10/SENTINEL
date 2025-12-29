import { Suspense } from "react";
import { requireSuperAdmin } from "@/actions/auth-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllGuards, getGuardStats } from "@/actions/guard-actions";
import GuardsClient from "@/components/features/admin/guards/GuardsClient";
import { GuardStatsView } from "@/components/features/admin/guards/GuardStatsView";
import { GuardActivityLogClient } from "@/components/features/admin/guards/GuardActivityLogClient";
import { ExportGuardsButton } from "@/components/features/admin/guards/ExportGuardsButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

// ============================================
// SERVER COMPONENTS
// ============================================

async function GuardsOverview() {
  const [guards, stats] = await Promise.all([getAllGuards(), getGuardStats()]);

  return (
    <div className="space-y-6">
      <GuardStatsView stats={stats} />
      <Card className="bg-white border-border shadow-sm">
        <CardHeader>
          <CardTitle>Security Guards</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Manage access and view performance
          </p>
        </CardHeader>
        <CardContent>
          <GuardsClient initialGuards={guards} />
        </CardContent>
      </Card>
    </div>
  );
}

// ================================================================
// ACTIVITY TAB (NEW: CLIENT-SIDE WITH PAGINATION)
// ================================================================
// OLD: Server-side fetch-all approach (commented out below)
// async function ActivityTab() {
//   const activity = await getGuardActivity(50);
//   return <GuardActivityLog activity={activity} />;
// }
//
// ISSUE: Fetched all 50 logs at once, no pagination, cannot access older records.
//
// NEW: Client-side component with paginated API calls
// - Supports pagination (Previous/Next + Page Numbers)
// - Loading skeleton during fetch
// - Can scale to thousands of logs
// - Future-ready for search and filters

// ============================================
// LOADING SKELETON
// ============================================

function GuardsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function GuardsPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Force</h1>
          <p className="text-muted-foreground mt-1">
            Guard accounts and real-time performance monitoring
          </p>
        </div>
        <ExportGuardsButton />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="mb-6 h-auto w-full rounded-none justify-start gap-2 md:gap-6 border-b bg-transparent p-0 overflow-x-auto">
          <TabsTrigger
            value="overview"
            className="relative gap-1.5 md:gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 text-sm md:text-base whitespace-nowrap data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="relative gap-1.5 md:gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 text-sm md:text-base whitespace-nowrap data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity Log</span>
            <span className="sm:hidden">Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Suspense fallback={<GuardsSkeleton />}>
            <GuardsOverview />
          </Suspense>
        </TabsContent>

        <TabsContent value="activity">
          {/* NEW: Client-side component with built-in loading states */}
          <GuardActivityLogClient />
        </TabsContent>
      </Tabs>
    </div>
  );
}
