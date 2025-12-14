"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { DataTable, DataTableToolbar } from "@/components/ui/data-table";
import {
  columns,
  type AuditLogEntry,
} from "@/app/(dashboard)/admin/logs/columns";
import { useState } from "react";
import { PaginationState } from "@tanstack/react-table";

interface SystemLogsClientProps {
  initialLogs: AuditLogEntry[];
  initialTotal: number;
}

const PAGE_SIZE = 20;

export function SystemLogsClient({
  initialLogs,
  initialTotal,
}: SystemLogsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL Params
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("q") || "";
  // Note: DataTableToolbar uses 'q' for search by default

  // We keep pagination state in sync with URL for the table
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page - 1,
    pageSize: PAGE_SIZE,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
        search: search,
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }
      return response.json() as Promise<{
        logs: AuditLogEntry[];
        total: number;
      }>;
    },
    initialData: { logs: initialLogs, total: initialTotal },
    placeholderData: (previousData) => previousData,
  });

  // Handle pagination changes from the table (which updates state, we need to push to URL?)
  // Actually DataTable component handles onPaginationChange.
  // But DataTableToolbar pushes to URL for search.
  // For pagination, if we use server-side, we usually need to update URL.
  // The DataTable component in this project might be designed for client-side pagination mostly?
  // Let's check ManagersTableClient again... it passed onPaginationChange={handlePaginationChange}
  // where handlePaginationChange updated the URL.

  // Wait, I don't have the handlePaginationChange logic from ManagersTableClient.
  // I'll implement a simple one here.

  const handlePaginationChange = (
    updaterOrValue:
      | PaginationState
      | ((old: PaginationState) => PaginationState)
  ) => {
    const newPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(pagination)
        : updaterOrValue;

    setPagination(newPagination);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (newPagination.pageIndex + 1).toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white">
        <DataTable
          columns={columns}
          data={data.logs}
          pageCount={Math.ceil(data.total / PAGE_SIZE)}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        >
          <DataTableToolbar searchPlaceholder="Search logs..." />
        </DataTable>
      </div>
    </div>
  );
}
