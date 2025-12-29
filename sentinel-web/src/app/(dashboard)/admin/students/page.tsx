import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentStatsView } from "@/components/features/admin/students/StudentStatsView";
import { StudentsDirectory } from "@/components/features/admin/students/StudentsDirectory";
import { StudentSearchConsole } from "@/components/features/admin/students/StudentSearchConsole";
import { getStudentStats, getAllStudents } from "@/actions/students-actions";
import { Loader2, LayoutDashboard, Users, Search } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    manager?: string;
    tab?: string;
  }>;
}

import { requireSuperAdmin } from "@/actions/auth-actions";

// ... imports ...

async function verifyAdmin() {
  await requireSuperAdmin();
}

export default async function StudentsPage({ searchParams }: PageProps) {
  await verifyAdmin();

  const params = await searchParams;
  const query = params.q || "";
  const page = Number(params.page) || 1;
  const managerSearch = params.manager || "";

  // Default tab logic: if query exists, go to search, otherwise overview
  const defaultTab = params.tab || (query ? "search" : "overview");

  // Fetch data in parallel
  const [stats, directoryData] = await Promise.all([
    getStudentStats(),
    getAllStudents(page, 20, managerSearch),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Student Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview, directory, and global search
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
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
            value="directory"
            className="relative gap-1.5 md:gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 text-sm md:text-base whitespace-nowrap data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Directory</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger
            value="search"
            className="relative gap-1.5 md:gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 text-sm md:text-base whitespace-nowrap data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search Console</span>
            <span className="sm:hidden">Search</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StudentStatsView stats={stats} />
        </TabsContent>

        <TabsContent value="directory" className="space-y-6">
          <StudentsDirectory
            data={directoryData.data}
            pageCount={directoryData.pageCount}
            currentPage={page}
            currentManagerSearch={managerSearch}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <StudentSearchConsole />
        </TabsContent>
      </Tabs>
    </div>
  );
}
