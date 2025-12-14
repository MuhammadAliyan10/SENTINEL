import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ManagersTableClient } from "./ManagersTableClient";
import { CreateManagerDialog } from "@/components/features/admin/managers/CreateManagerDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, DollarSign, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Prisma, UserRole } from "@prisma/client";
import { getTicketPrice } from "@/actions/settings-actions";

export const dynamic = "force-dynamic";

// ============================================
// TYPES
// ============================================

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    q?: string;
  }>;
}

// ============================================
// AUTH CHECK
// ============================================

import { requireSuperAdmin } from "@/actions/auth-actions";

// ... imports ...

async function verifyAdmin() {
  await requireSuperAdmin();
}

// ============================================
// DATA FETCHING
// ============================================

async function getManagersData(page: number, limit: number, search?: string) {
  const skip = (page - 1) * limit;

  // Build where clause with proper Prisma types
  const managerRoles: UserRole[] = [UserRole.CR, UserRole.GR];

  const whereClause: Prisma.UserWhereInput = {
    role: { in: managerRoles },
  };

  if (search) {
    whereClause.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { section: { contains: search, mode: "insensitive" } },
    ];
  }

  // Parallel queries for data, count, and stats (optimized with separate counts)
  const [managers, total, activeCount, frozenCount, studentAggregate] =
    await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [{ semester: "asc" }, { section: "asc" }],
        select: {
          id: true,
          sapId: true,
          fullName: true,
          role: true,
          semester: true,
          section: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { createdUsers: true },
          },
        },
      }),
      prisma.user.count({ where: whereClause }),
      // Active managers count
      prisma.user.count({
        where: { role: { in: managerRoles }, isActive: true },
      }),
      // Frozen managers count
      prisma.user.count({
        where: { role: { in: managerRoles }, isActive: false },
      }),
      // Student count
      prisma.user.aggregate({
        where: { role: "STUDENT" },
        _count: { id: true },
      }),
    ]);

  // Calculate stats from counts (not array iteration)
  const activeManagers = activeCount;
  const frozenManagers = frozenCount;
  const totalManagers = activeManagers + frozenManagers;
  const totalStudents = studentAggregate._count.id;

  // Use dynamic ticket price instead of hardcoded 2000
  const ticketPrice = await getTicketPrice();
  const totalCash = totalStudents * ticketPrice;

  // Transform data for table
  const tableData = managers.map((m) => ({
    id: m.id,
    sapId: m.sapId,
    fullName: m.fullName,
    role: m.role as "CR" | "GR",
    section: m.section,
    semester: m.semester,
    isActive: m.isActive,
    createdAt: m.createdAt,
    studentsCount: m._count.createdUsers,
    cashLiability: m._count.createdUsers * ticketPrice,
  }));

  const pageCount = Math.ceil(total / limit);

  return {
    data: tableData,
    pageCount,
    total,
    stats: {
      totalManagers,
      activeManagers,
      totalStudents,
      totalCash,
      ticketPrice,
    },
  };
}

// ============================================
// SERVER COMPONENT
// ============================================

async function ManagersData({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search?: string;
}) {
  const { data, pageCount, stats } = await getManagersData(page, limit, search);

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Managers
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserCog className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.totalManagers}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeManagers} active,{" "}
              {stats.totalManagers - stats.activeManagers} frozen
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Students Registered
            </CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">
              By all managers combined
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cash Liability
            </CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              Rs. {stats.totalCash.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              @ Rs. {stats.ticketPrice.toLocaleString()} per student
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Managers Table */}
      <Card className="bg-white border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Managers</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Class Representatives (CR) and Girls Representatives (GR)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CreateManagerDialog />
          </div>
        </CardHeader>
        <CardContent>
          <ManagersTableClient
            initialData={data}
            pageCount={pageCount}
            currentPage={page}
            pageSize={limit}
          />
        </CardContent>
      </Card>
    </>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function ManagersSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white border-border shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-white border-border shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </>
  );
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function ManagersPage({ searchParams }: PageProps) {
  await verifyAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(50, Math.max(5, parseInt(params.limit || "10", 10)));
  const search = params.q?.trim();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Hierarchy Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Create and monitor CR (Boys Rep) and GR (Girls Rep) accounts
        </p>
      </div>

      {/* Content */}
      <Suspense fallback={<ManagersSkeleton />}>
        <ManagersData page={page} limit={limit} search={search} />
      </Suspense>
    </div>
  );
}
