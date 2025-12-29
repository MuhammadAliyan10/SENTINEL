"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users,
  List,
} from "lucide-react";

interface ActivityLog {
  id: string;
  timestamp: Date | string;
  status: "GRANTED" | "REJECTED" | "DUPLICATE";
  type: "ENTRY" | "EXIT";
  gateNumber: number | string | null;
  user: {
    fullName: string | null;
    sapId: string | null;
    role: string;
    profilePhotoUrl: string | null;
  };
}

interface ActivityTableProps {
  initialData: ActivityLog[];
  totalCount: number;
  pageSize?: number;
}

type FilterType = "all" | "alerts" | "staff";

export function ActivityTable({
  initialData,
  totalCount,
  pageSize = 10,
}: ActivityTableProps) {
  const [logs, setLogs] = useState<ActivityLog[]>(initialData);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(totalCount);

  const totalPages = Math.ceil(total / pageSize);

  const fetchLogs = async (newPage: number, newFilter: FilterType) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/activity-logs?page=${newPage}&limit=${pageSize}&filter=${newFilter}`
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchLogs(newPage, filter);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
    fetchLogs(1, newFilter);
  };

  const getStatusBadge = (
    status: ActivityLog["status"],
    type: ActivityLog["type"]
  ) => {
    if (status === "GRANTED") {
      if (type === "ENTRY") {
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
            Entered
          </span>
        );
      } else {
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-700">
            Exited
          </span>
        );
      }
    }

    switch (status) {
      case "REJECTED":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700">
            Rejected
          </span>
        );
      case "DUPLICATE":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
            Duplicate
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    const isSpecial = ["CR", "GR", "GUARD"].includes(role);
    return (
      <span
        className={cn(
          "px-2 py-0.5 text-xs font-medium rounded",
          isSpecial
            ? "bg-[#4F39F6]/10 text-[#4F39F6]"
            : "bg-slate-100 text-slate-600"
        )}
      >
        {role}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">All Activity</h3>
        <p className="text-sm text-slate-500 mt-1">
          Recent access logs and scans
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Gate
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                  </tr>
                ))
              : logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-900">
                        {new Date(log.timestamp).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                          timeZone: "Asia/Karachi",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                          {log.user.profilePhotoUrl ? (
                            <Image
                              src={log.user.profilePhotoUrl}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs font-medium">
                              {log.user.fullName?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {log.user.fullName || "Unknown"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {log.user.sapId || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getRoleBadge(log.user.role)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {log.gateNumber
                          ? `Gate ${log.gateNumber}`
                          : "Main Gate"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(log.status, log.type)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <p className="text-sm text-slate-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
            className="border-[#4F39F6] text-[#4F39F6] hover:bg-[#4F39F6]/5"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || isLoading}
            className="border-[#4F39F6] text-[#4F39F6] hover:bg-[#4F39F6]/5"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
