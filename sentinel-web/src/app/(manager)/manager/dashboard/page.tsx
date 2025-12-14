import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTicketPrice } from "@/actions/settings-actions";
import { Badge } from "@/components/ui/badge";

// Components
import { ManagerStats } from "@/components/features/manager/ManagerStats";
import { RegistrationForm } from "@/components/features/manager/RegistrationForm";
import { MyRosterTable } from "@/components/features/manager/MyRosterTable";

export const dynamic = "force-dynamic";

// ============================================
// DATA FETCHING
// ============================================

async function getManagerData(page: number) {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/login");

  // Get manager profile
  const manager = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: { id: true, fullName: true, role: true, section: true },
  });

  if (!manager || (manager.role !== "CR" && manager.role !== "GR")) {
    redirect("/unauthorized");
  }

  // Get ticket price from active event
  const ticketPrice = await getTicketPrice();

  // Parallel queries
  const pageSize = 10;
  const [roster, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: { createdById: manager.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        sapId: true,
        fullName: true,
        activationToken: true,
        createdAt: true,
      },
    }),
    prisma.user.count({
      where: { createdById: manager.id },
    }),
  ]);

  return {
    manager,
    ticketPrice,
    roster,
    totalCount,
    page,
  };
}

// ============================================
// PAGE
// ============================================

export default async function ManagerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const data = await getManagerData(page);

  return (
    <div className="min-h-screen bg-slate-50 -m-4 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Manager Portal
            </h1>
            <p className="text-slate-500 mt-1">
              Hello, {data.manager.fullName?.split(" ")[0] || "Manager"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#4F39F6]">{data.manager.role}</Badge>
            {data.manager.section && (
              <Badge variant="outline">Section {data.manager.section}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <ManagerStats
          totalStudents={data.totalCount}
          ticketPrice={data.ticketPrice}
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Roster Table (2/3) */}
        <div className="lg:col-span-2">
          <MyRosterTable
            initialData={data.roster}
            totalCount={data.totalCount}
            currentPage={data.page}
          />
        </div>

        {/* Registration Form (1/3) */}
        <div>
          <RegistrationForm ticketPrice={data.ticketPrice} />
        </div>
      </div>
    </div>
  );
}
