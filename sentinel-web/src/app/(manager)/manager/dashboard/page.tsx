import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getManagerStats, getManagerLedger } from "@/actions/manager";
import { IssuePassForm } from "@/components/manager/IssuePassForm";
import { LedgerList } from "@/components/manager/LedgerList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Users } from "lucide-react";

export const dynamic = "force-dynamic";

async function getManagerProfile() {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: { fullName: true, role: true, section: true },
  });

  return user;
}

export default async function ManagerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const [user, stats, ledger] = await Promise.all([
    getManagerProfile(),
    getManagerStats(),
    getManagerLedger(page, 10),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto md:max-w-2xl lg:max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hello, {user.fullName?.split(" ")[0] || "Manager"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="font-mono">
              {user.role}
            </Badge>
            {user.section && (
              <Badge variant="outline">Section {user.section}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary-foreground/80 text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Cash Collected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            Rs. {stats.cashCollected.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-2 text-primary-foreground/70 text-sm">
            <Users className="h-4 w-4" />
            {stats.totalPasses} passes issued
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="py-2">
        <IssuePassForm />
      </div>

      {/* Ledger */}
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <LedgerList entries={ledger} />
      </Suspense>
    </div>
  );
}
