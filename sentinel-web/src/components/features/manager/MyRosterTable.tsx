"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface RosterEntry {
  id: string;
  sapId: string;
  fullName: string | null;
  activationToken: string | null;
  createdAt: Date | string;
}

interface MyRosterTableProps {
  initialData: RosterEntry[];
  totalCount: number;
  currentPage: number;
  pageSize?: number;
}

export function MyRosterTable({
  initialData,
  totalCount,
  currentPage,
  pageSize = 10,
}: MyRosterTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleCopyToken = async (token: string, id: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedId(id);
    toast.success("Token copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Karachi",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">My Roster</h3>
        <p className="text-sm text-slate-500">
          {totalCount} students registered
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                SAP ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Token
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date Added
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialData.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  No students registered yet
                </td>
              </tr>
            ) : (
              initialData.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 font-mono">
                      {entry.sapId}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-700">
                      {entry.fullName || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.activationToken ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[#4F39F6] bg-[#4F39F6]/10 px-2 py-1 rounded">
                          {entry.activationToken}
                        </span>
                        <button
                          onClick={() =>
                            handleCopyToken(entry.activationToken!, entry.id)
                          }
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          {copiedId === entry.id ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-500">
                      {formatDate(entry.createdAt)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              asChild
              className="border-[#4F39F6] text-[#4F39F6] hover:bg-[#4F39F6]/5"
            >
              <a href={`?page=${currentPage - 1}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              asChild
              className="border-[#4F39F6] text-[#4F39F6] hover:bg-[#4F39F6]/5"
            >
              <a href={`?page=${currentPage + 1}`}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
