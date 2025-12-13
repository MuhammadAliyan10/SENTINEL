"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardKPIs } from "@/actions/dashboard-actions";
import {
  Users,
  Wallet,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIGridProps {
  data: DashboardKPIs;
}

export function KPIGrid({ data }: KPIGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Live Occupancy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Live Occupancy</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              data.liveOccupancy.status === "critical"
                ? "text-red-600"
                : data.liveOccupancy.status === "warning"
                ? "text-amber-600"
                : ""
            )}
          >
            {data.liveOccupancy.value}
          </div>
          <p className="text-xs text-muted-foreground">
            People currently inside
          </p>
        </CardContent>
      </Card>

      {/* Cash on Hand */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash on Hand</CardTitle>
          <Wallet className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {data.cashOnHand.currency} {data.cashOnHand.value.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Total collected revenue
          </p>
        </CardContent>
      </Card>

      {/* Gate Velocity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gate Velocity</CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.gateVelocity.value}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              /hr
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Scans in last 60 mins</p>
        </CardContent>
      </Card>

      {/* Security Interventions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interventions</CardTitle>
          <ShieldAlert className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {data.securityInterventions.value}
          </div>
          <p className="text-xs text-muted-foreground">Denied scans today</p>
        </CardContent>
      </Card>
    </div>
  );
}
