"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  User,
  Shield,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ================================================================
// TYPES
// ================================================================

interface GuardActivity {
  id: string;
  type: string;
  status: string;
  timestamp: string;
  guardId: string | null;
  guardName: string;
  guardEmail: string;
  studentName: string;
  studentSapId: string;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ================================================================
// LOADING SKELETON
// ================================================================

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

// ================================================================
// MAIN COMPONENT (CLIENT-SIDE WITH PAGINATION)
// ================================================================

export function GuardActivityLogClient() {
  const [activity, setActivity] = useState<GuardActivity[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch activity logs with pagination
  const fetchActivity = async (page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/guards/activity?page=${page}&pageSize=${pagination.pageSize}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activity logs");
      }

      const data = await response.json();
      setActivity(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Fetch Activity Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchActivity(1);
  }, []);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchActivity(page);
    }
  };

  const nextPage = () => {
    if (pagination.hasNextPage) {
      fetchActivity(pagination.currentPage + 1);
    }
  };

  const previousPage = () => {
    if (pagination.hasPreviousPage) {
      fetchActivity(pagination.currentPage - 1);
    }
  };

  // ================================================================
  // RENDER: ERROR STATE
  // ================================================================
  if (error) {
    return (
      <Card className="bg-white border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-destructive">
          <Activity className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Error Loading Activity</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            onClick={() => fetchActivity(pagination.currentPage)}
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ================================================================
  // RENDER: EMPTY STATE
  // ================================================================
  if (!isLoading && activity.length === 0) {
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

  // ================================================================
  // RENDER: MAIN CONTENT
  // ================================================================
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Guard Activity Log</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {pagination.totalItems} total scan logs from security guards
            </p>
          </div>
          {/* Page Info */}
          <div className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {isLoading ? (
          <ActivitySkeleton />
        ) : (
          <>
            {/* Activity List */}
            <div className="space-y-3 mb-6">
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
                          {new Date(scan.timestamp).toLocaleDateString(
                            "en-PK",
                            {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </div>
                        <div className="font-mono">
                          {new Date(scan.timestamp).toLocaleTimeString(
                            "en-PK",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.currentPage - 1) * pagination.pageSize + 1}{" "}
                to{" "}
                {Math.min(
                  pagination.currentPage * pagination.pageSize,
                  pagination.totalItems
                )}{" "}
                of {pagination.totalItems} entries
              </div>

              <div className="flex gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousPage}
                  disabled={!pagination.hasPreviousPage || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  )
                    .filter((page) => {
                      // Show first, last, current, and adjacent pages
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis for gaps
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <div key={page} className="flex gap-1">
                          {showEllipsis && (
                            <span className="px-2 py-1 text-sm text-muted-foreground">
                              ...
                            </span>
                          )}
                          <Button
                            variant={
                              page === pagination.currentPage
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => goToPage(page)}
                            disabled={isLoading}
                            className="min-w-10"
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!pagination.hasNextPage || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
