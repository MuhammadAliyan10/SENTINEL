import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileSearch,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

async function getAuditData(page: number) {
  // Verify SUPER_ADMIN access
  await requireSuperAdminPage();

  const skip = (page - 1) * PAGE_SIZE;
  const managerRoles: UserRole[] = [UserRole.CR, UserRole.GR];

  // Parallel queries: paginated list + counts
  const [managers, total, activeCount, frozenCount, studentAggregates] =
    await prisma.$transaction([
      // Paginated managers
      prisma.user.findMany({
        where: { role: { in: managerRoles } },
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          sapId: true,
          fullName: true,
          role: true,
          section: true,
          isActive: true,
          _count: {
            select: { createdUsers: true },
          },
        },
        orderBy: [{ section: "asc" }, { role: "asc" }],
      }),
      // Total count
      prisma.user.count({
        where: { role: { in: managerRoles } },
      }),
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

  const totalStudents = studentAggregates._count.id;
  const totalCash = totalStudents * 2000;
  const activeManagers = activeCount;
  const frozenManagers = frozenCount;
  const totalManagers = activeManagers + frozenManagers;

  const pageCount = Math.ceil(total / PAGE_SIZE);

  return {
    managers,
    total,
    pageCount,
    totalStudents,
    totalCash,
    activeManagers,
    totalManagers,
  };
}

export default async function AuditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const {
    managers,
    pageCount,
    totalStudents,
    totalCash,
    activeManagers,
    totalManagers,
  } = await getAuditData(page);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Financial Audit Ledger
        </h1>
        <p className="text-muted-foreground mt-1">
          Track cash liability by manager (paginated, optimized)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Managers
            </CardTitle>
            <FileSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeManagers}/{totalManagers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students Registered
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalStudents.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">
              Total Expected Cash
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              Rs. {totalCash.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Table */}
      <Card className="bg-white border-border shadow-sm">
        <CardHeader>
          <CardTitle>Manager Liability Report</CardTitle>
          <CardDescription>
            Cash expected from each CR/GR based on students registered (Page{" "}
            {page} of {pageCount || 1})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {managers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No managers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Section</TableHead>
                  <TableHead className="font-semibold">Manager</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="text-right font-semibold">
                    Students
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Cash (Rs.)
                  </TableHead>
                  <TableHead className="text-center font-semibold">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((manager) => {
                  const cashAmount = manager._count.createdUsers * 2000;
                  return (
                    <TableRow
                      key={manager.id}
                      className={
                        !manager.isActive ? "opacity-50 bg-slate-50" : ""
                      }
                    >
                      <TableCell className="font-mono font-medium">
                        {manager.section || "—"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">
                            {manager.fullName || "Unnamed"}
                          </span>
                          <span className="block text-xs text-muted-foreground font-mono">
                            {manager.sapId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            manager.role === "CR"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-pink-50 text-pink-700 border-pink-200"
                          }
                        >
                          {manager.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-lg">
                        {manager._count.createdUsers}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-lg">
                        {cashAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {manager.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            Frozen
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {pageCount > 1 && (
          <CardFooter className="border-t border-border flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Showing page {page} of {pageCount}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link href={`?page=${page - 1}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Link>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                asChild={page < pageCount}
              >
                {page < pageCount ? (
                  <Link href={`?page=${page + 1}`}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        )}

        {managers.length > 0 && (
          <CardFooter className="bg-slate-50 border-t border-border">
            <div className="w-full flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {totalManagers} managers × students × Rs. 2,000
              </span>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">
                  Total Expected Cash
                </span>
                <div className="text-2xl font-bold text-foreground">
                  Rs. {totalCash.toLocaleString()}
                </div>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
