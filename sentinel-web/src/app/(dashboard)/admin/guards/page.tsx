import { Suspense } from "react";
import { requireSuperAdmin } from "@/actions/auth-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, Activity } from "lucide-react";
import {
  getAllGuards,
  getGuardStats,
  getGuardActivity,
} from "@/actions/guard-actions";
import GuardsClient from "@/components/features/admin/GuardsClient";
import { GuardStatsView } from "@/components/features/admin/guards/GuardStatsView";
import { GuardActivityLog } from "@/components/features/admin/guards/GuardActivityLog";

export const dynamic = "force-dynamic";

// ============================================
// SERVER COMPONENTS
// ============================================

async function GuardsOverview() {
  const [guards, stats] = await Promise.all([getAllGuards(), getGuardStats()]);

  return (
    <>
      <GuardStatsView stats={stats} />
      <Card className="bg-white border-border shadow-sm">
        <CardContent className="pt-6">
          <GuardsClient initialGuards={guards} />
        </CardContent>
      </Card>
    </>
  );
}

async function ActivityTab() {
  const activity = await getGuardActivity(50);
  return <GuardActivityLog activity={activity} />;
}

// ============================================
// LOADING SKELETON
// ============================================

function GuardsSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white border-border shadow-sm">
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
      <Card className="bg-white border-border shadow-sm">
        <Skeleton className="h-96 w-full" />
      </Card>
    </>
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Guard Management</h1>
        <p className="text-muted-foreground mt-1">
          Security guard accounts and activity monitoring
        </p>
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

        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<GuardsSkeleton />}>
            <GuardsOverview />
          </Suspense>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Suspense fallback={<GuardsSkeleton />}>
            <ActivityTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
