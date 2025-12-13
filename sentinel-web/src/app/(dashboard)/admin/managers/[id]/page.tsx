import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getManagerById, getManagerStats } from "@/actions/managers-actions";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { ManagerActions } from "./ManagerActions";
import { UserRole } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
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

function TableSkeleton() {
  return <Skeleton className="h-64" />;
}

// ============================================
// STATS CARDS
// ============================================

interface StatsCardsProps {
  studentsCount: number;
  cashCollected: number;
}

function StatsCards({ studentsCount, cashCollected }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Students Registered
              </p>
              <p className="text-2xl font-bold">{studentsCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cash Collected</p>
              <p className="text-2xl font-bold">
                Rs. {cashCollected.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Per Student</p>
              <p className="text-2xl font-bold">Rs. 2,000</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Target</p>
              <p className="text-2xl font-bold">50</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// STUDENTS TABLE
// ============================================

interface StudentsTableProps {
  managerId: string;
}

async function StudentsTable({ managerId }: StudentsTableProps) {
  const stats = await getManagerStats(managerId);

  if (!stats || stats.recentStudents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No students registered yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Registered Students</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SAP ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Registered On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.recentStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-mono">{student.sapId}</TableCell>
                <TableCell>{student.fullName || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(student.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================
// AUDIT LOGS TABLE
// ============================================

interface AuditLogsTableProps {
  managerId: string;
}

async function AuditLogsTable({ managerId }: AuditLogsTableProps) {
  const stats = await getManagerStats(managerId);

  if (!stats || stats.auditLogs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No audit logs found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {log.details || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================
// PAGE
// ============================================

export default async function ManagerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const manager = await getManagerById(id);

  if (!manager) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back Button + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/managers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <PageHeader
            title={manager.fullName || manager.sapId}
            description={`${manager.role} • Section ${manager.section || "—"}`}
          >
            <div className="flex items-center gap-2">
              <Badge
                className={
                  manager.role === UserRole.CR
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-pink-100 text-pink-700 border-pink-200"
                }
              >
                {manager.role}
              </Badge>
              <Badge
                variant={manager.isActive ? "default" : "destructive"}
                className={
                  manager.isActive ? "bg-green-100 text-green-700" : ""
                }
              >
                {manager.isActive ? "Active" : "Frozen"}
              </Badge>
            </div>
          </PageHeader>
        </div>
        <ManagerActions manager={manager} />
      </div>

      {/* Stats Cards */}
      <StatsCards
        studentsCount={manager.studentsCount}
        cashCollected={manager.cashCollected}
      />

      {/* Tabs */}
      <Tabs defaultValue="students" className="flex h-full flex-col">
        <TabsList className="mb-6 h-auto w-full rounded-none justify-start gap-6 border-b bg-transparent p-0">
          <TabsTrigger
            value="students"
            className="relative gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Users className="h-4 w-4" /> Students
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="relative gap-2 rounded-none border-b-2 border-transparent pb-3 pt-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <FileText className="h-4 w-4" /> Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Suspense fallback={<TableSkeleton />}>
            <StudentsTable managerId={manager.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="audit">
          <Suspense fallback={<TableSkeleton />}>
            <AuditLogsTable managerId={manager.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
