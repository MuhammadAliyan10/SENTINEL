"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  timestamp: Date | string;
  action: string;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  performer: {
    fullName: string | null;
    profilePhotoUrl: string | null;
  };
}

interface LogTableProps {
  logs: AuditLogEntry[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

const HIGH_RISK_ACTIONS = ["DELETE", "BAN", "REVOKE", "MANUAL_OVERRIDE"];

export function LogTable({
  logs,
  totalCount,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
}: LogTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("ID copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isHighRisk = (action: string) =>
    HIGH_RISK_ACTIONS.some((risk) => action.toUpperCase().includes(risk));

  const formatTimestamp = (ts: Date | string) => {
    const date = typeof ts === "string" ? new Date(ts) : ts;
    return date
      .toLocaleString("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Karachi",
      })
      .replace(",", "");
  };

  const formatDetails = (details: string | null) => {
    if (!details) return null;
    try {
      return JSON.stringify(JSON.parse(details), null, 2);
    } catch {
      return details;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Performer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Target
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    className={cn(
                      "hover:bg-indigo-50/30 transition-colors cursor-pointer",
                      expandedId === log.id && "bg-slate-50"
                    )}
                    onClick={() =>
                      setExpandedId(expandedId === log.id ? null : log.id)
                    }
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-slate-700">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                          {log.performer.profilePhotoUrl ? (
                            <Image
                              src={log.performer.profilePhotoUrl}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs font-medium">
                              {log.performer.fullName?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {log.performer.fullName || "System"}
                          </p>
                          {log.ipAddress && (
                            <p className="text-xs text-slate-400 font-mono">
                              {log.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2.5 py-1 text-xs font-medium rounded-full",
                          isHighRisk(log.action)
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.targetId ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-slate-600 max-w-[100px] truncate">
                            {log.targetId}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyId(log.targetId!);
                            }}
                            className="p-1 hover:bg-slate-100 rounded"
                          >
                            {copiedId === log.targetId ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-slate-400" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-500">
                        {log.details ? (
                          <>
                            <span className="text-xs truncate max-w-[120px]">
                              {log.details.substring(0, 40)}...
                            </span>
                            {expandedId === log.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Details */}
                  {expandedId === log.id && log.details && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 bg-slate-900">
                        <pre className="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                          {formatDetails(log.details)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <p className="text-sm text-slate-500">
          Page {currentPage} of {totalPages || 1} ({totalCount} total)
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="border-[#4F39F6] text-[#4F39F6] hover:bg-[#4F39F6]/5"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
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
