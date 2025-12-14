import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, User, Shield, Calendar } from "lucide-react";
import { type GuardActivity } from "@/actions/guard-actions";

interface GuardActivityLogProps {
  activity: GuardActivity[];
}

export function GuardActivityLog({ activity }: GuardActivityLogProps) {
  if (activity.length === 0) {
    return (
      <Card className="bg-white border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Activity className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No scan activity yet</p>
          <p className="text-sm">Guard scans will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">
          Last {activity.length} scan logs from security guards
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activity.map((scan) => (
            <div
              key={scan.id}
              className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Main Info */}
                <div className="flex-1 space-y-2">
                  {/* Guard Info */}
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">
                      {scan.guardName}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {scan.guardEmail}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">scanned</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        scan.type === "ENTRY"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {scan.type}
                    </span>
                    <span className="text-muted-foreground">for</span>
                  </div>

                  {/* Student Info */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{scan.studentName}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      ({scan.studentSapId})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
                        scan.status === "GRANTED"
                          ? "bg-blue-100 text-blue-700"
                          : scan.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {scan.status}
                    </span>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  <Calendar className="h-3.5 w-3.5" />
                  <div className="text-right">
                    <div>
                      {new Date(scan.timestamp).toLocaleDateString("en-PK", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                    <div className="font-mono">
                      {new Date(scan.timestamp).toLocaleTimeString("en-PK", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
