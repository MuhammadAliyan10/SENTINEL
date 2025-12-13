import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdminPage } from "@/lib/auth";

// Mock entry logs data
const mockLogs = [
  {
    id: "1",
    studentName: "Ahmed Khan",
    studentId: "2024-CS-001",
    status: "allowed",
    location: "Main Gate",
    time: "2024-12-12T10:30:00Z",
    guardDevice: "GATE-01",
  },
  {
    id: "2",
    studentName: "Sara Ali",
    studentId: "2024-CS-002",
    status: "allowed",
    location: "Library Entrance",
    time: "2024-12-12T10:25:00Z",
    guardDevice: "LIB-01",
  },
  {
    id: "3",
    studentName: "Muhammad Zain",
    studentId: "2024-EE-015",
    status: "rejected",
    location: "Main Gate",
    time: "2024-12-12T10:20:00Z",
    guardDevice: "GATE-01",
  },
  {
    id: "4",
    studentName: "Fatimah Hassan",
    studentId: "2024-CS-003",
    status: "re-entry",
    location: "Main Gate",
    time: "2024-12-12T10:15:00Z",
    guardDevice: "GATE-02",
  },
];

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "allowed":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "re-entry":
      return <RotateCcw className="h-4 w-4 text-amber-600" />;
    default:
      return null;
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "allowed":
      return "bg-green-50 text-green-700 border-green-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "re-entry":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "";
  }
}

export default async function LogsPage() {
  // Defense-in-depth: Explicit auth check
  await requireSuperAdminPage();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scan Logs</h1>
        <p className="text-muted-foreground mt-1">
          Monitor real-time entry and exit activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Entries
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">156</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Allowed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">142</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">8</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Re-entries
            </CardTitle>
            <RotateCcw className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">6</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card className="bg-white border-border shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Real-time scan events from all gates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <StatusIcon status={log.status} />
                  <div>
                    <p className="font-medium text-foreground">
                      {log.studentName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {log.studentId} • {log.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={getStatusBadgeClass(log.status)}
                  >
                    {log.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.time).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.guardDevice}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
