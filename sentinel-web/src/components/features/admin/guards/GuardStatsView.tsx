import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Activity } from "lucide-react";
import { type GuardStats } from "@/actions/guard-actions";

interface GuardStatsViewProps {
  stats: GuardStats;
}

export function GuardStatsView({ stats }: GuardStatsViewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-white border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Guards
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {stats.total}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.active} active, {stats.inactive} inactive
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active Guards
          </CardTitle>
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {stats.active}
          </div>
          <p className="text-xs text-muted-foreground">
            Ready for mobile access
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Scans
          </CardTitle>
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {stats.totalScans}
          </div>
          <p className="text-xs text-muted-foreground">
            All-time check-ins/outs
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
