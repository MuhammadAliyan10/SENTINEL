"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertTriangle, Wallet } from "lucide-react";
import { DashboardMetrics } from "@/types/admin";

interface StatsGridProps {
  initialData: DashboardMetrics;
}

export function StatsGrid({ initialData }: StatsGridProps) {
  const router = useRouter();

  useEffect(() => {
    // Poll every 30 seconds to keep stats fresh
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{initialData.totalStudents}</div>
          <p className="text-xs text-muted-foreground">Registered in system</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Today</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{initialData.activeToday}</div>
          <p className="text-xs text-muted-foreground">Scanned in last 24h</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inside Campus</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{initialData.insideCampus}</div>
          <p className="text-xs text-muted-foreground">Currently checked in</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash Collected</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Rs. {initialData.cashCollected.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Total revenue generated
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
