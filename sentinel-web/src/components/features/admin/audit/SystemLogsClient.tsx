"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  columns,
  type AuditLogEntry,
} from "@/app/(dashboard)/admin/logs/columns";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table";
import {
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
} from "lucide-react";

interface SystemLogsClientProps {
  initialLogs: AuditLogEntry[];
  initialTotal: number;
}

const PAGE_SIZE = 20;

export function SystemLogsClient({
  initialLogs,
  initialTotal,
}: SystemLogsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get URL params
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlSearch = searchParams.get("q") || "";

  // Local state
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [searchValue, setSearchValue] = useState(urlSearch);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state synced with URL
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: urlPage - 1,
    pageSize: PAGE_SIZE,
  });

  // Fetch logs from API
  const fetchLogs = async (page: number, search: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
        search: search,
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch logs");

      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect: Fetch when URL params change
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("q") || "";

    // Only fetch if this isn't the initial render with initial data
    if (page !== 1 || search !== "") {
      fetchLogs(page, search);
    }

    setPagination((prev) => ({ ...prev, pageIndex: page - 1 }));
    setSearchValue(search);
  }, [searchParams]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update URL if search value changed from URL value
      if (searchValue !== urlSearch) {
        const params = new URLSearchParams(searchParams.toString());

        if (searchValue) {
          params.set("q", searchValue);
        } else {
          params.delete("q");
        }
        params.set("page", "1"); // Reset to first page on search

        router.push(`?${params.toString()}`);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Handle pagination change
  const handlePaginationChange = (pageIndex: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (pageIndex + 1).toString());
    router.push(`?${params.toString()}`);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLogs(pagination.pageIndex + 1, searchValue);
    setIsRefreshing(false);
  };

  // Clear search
  const clearSearch = () => {
    setSearchValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  // Table instance
  const pageCount = Math.ceil(total / PAGE_SIZE);

  const table = useReactTable({
    data: logs,
    columns,
    pageCount,
    state: {
      pagination,
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater;
      setPagination(newPagination);
      handlePaginationChange(newPagination.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const currentPage = pagination.pageIndex + 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs by action, performer..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={clearSearch}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          title="Refresh Data"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Results count */}
      {urlSearch && (
        <p className="text-sm text-muted-foreground">
          Found {total} result(s) for "{urlSearch}"
        </p>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      )}

      {/* Table */}
      <div
        className={`rounded-md border border-border bg-white ${
          isLoading ? "opacity-50" : ""
        }`}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="bg-slate-50">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {urlSearch ? "No matching logs found." : "No logs available."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {logs.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to{" "}
          {Math.min(currentPage * PAGE_SIZE, total)} of {total} logs
        </div>

        <div className="flex items-center gap-2">
          {/* First Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePaginationChange(0)}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePaginationChange(pagination.pageIndex - 1)}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Info */}
          <span className="text-sm text-muted-foreground px-2">
            Page {currentPage} of {pageCount || 1}
          </span>

          {/* Next */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePaginationChange(pagination.pageIndex + 1)}
            disabled={!table.getCanNextPage() || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePaginationChange(pageCount - 1)}
            disabled={!table.getCanNextPage() || isLoading}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
