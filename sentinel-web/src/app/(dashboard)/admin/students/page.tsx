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
    filter?: "all" | "paid" | "unpaid";
    tab?: string;
  }>;
}

import { requireSuperAdmin } from "@/lib/auth";

// ... imports ...

async function verifyAdmin() {
  await requireSuperAdmin();
}

export default async function StudentsPage({ searchParams }: PageProps) {
  await verifyAdmin();

  const params = await searchParams;
  const query = params.q || "";
  const page = Number(params.page) || 1;
  const filter = params.filter || "all";

  // Default tab logic: if query exists, go to search, otherwise overview
  const defaultTab = params.tab || (query ? "search" : "overview");

  // Fetch data in parallel
  const [stats, directoryData] = await Promise.all([
    getStudentStats(),
    getAllStudents(page, 20, filter),
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
        <TabsList className="mb-6 h-auto w-full rounded-none justify-start gap-6 border-b bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="relative gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <LayoutDashboard className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger
            value="directory"
            className="relative gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Users className="h-4 w-4" /> Directory
          </TabsTrigger>
          <TabsTrigger
            value="search"
            className="relative gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Search className="h-4 w-4" /> Search Console
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
            currentFilter={filter}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <StudentSearchConsole />
        </TabsContent>
      </Tabs>
    </div>
  );
}
