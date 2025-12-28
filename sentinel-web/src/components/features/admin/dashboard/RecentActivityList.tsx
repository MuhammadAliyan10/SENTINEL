"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccessLog {
  id: string;
  timestamp: Date;
  status: string;
  type: "ENTRY" | "EXIT";
  gateNumber: string | null;
  user: {
    sapId: string;
    fullName: string | null;
  } | null;
}

interface RecentActivityListProps {
  logs: AccessLog[];
  limit?: number;
  showFilters?: boolean;
  className?: string;
}

function StatusBadge({
  status,
  type,
}: {
  status: string;
  type: "ENTRY" | "EXIT";
}) {
  if (status === "GRANTED") {
    if (type === "ENTRY") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Entered
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Exited
        </Badge>
      );
    }
  }

  switch (status) {
    case "REJECTED":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    case "DUPLICATE":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
          <Clock className="h-3 w-3" />
          Duplicate
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function RecentActivityList({
  logs,
  limit = 10,
  showFilters = false,
  className,
}: RecentActivityListProps) {
  const [filteredLogs, setFilteredLogs] = useState(logs);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Apply filters
  useEffect(() => {
    let result = logs;

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (log) =>
          log.user?.sapId?.includes(searchQuery) ||
          log.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((log) => log.status === statusFilter);
    }

    // Apply limit
    setFilteredLogs(result.slice(0, limit));
  }, [logs, searchQuery, statusFilter, limit]);

  return (
    <Card className={cn("bg-white border-border shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>
          {showFilters
            ? "All access log entries"
            : `Last ${limit} access attempts`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        {showFilters && (
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SAP ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="GRANTED">Granted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="DUPLICATE">Duplicate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Table */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activity logs found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>SAP ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(log.timestamp).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: "Asia/Karachi",
                    })}
                  </TableCell>
                  <TableCell className="font-mono">
                    {log.user?.sapId || "—"}
                  </TableCell>
                  <TableCell>{log.user?.fullName || "Unknown"}</TableCell>
                  <TableCell>
                    <StatusBadge status={log.status} type={log.type} />
                  </TableCell>
                  <TableCell>{log.gateNumber || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
