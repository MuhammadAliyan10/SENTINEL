"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Activity,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Radio,
  Zap,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EntryStatus } from "@/types/database";

// Define the shape of the Supabase response
interface SupabaseLogRow {
  id: string;
  timestamp: string;
  status: string;
  gate_number: string | null;
  user_id: string;
  type: string;
}

interface LiveEntry {
  id: string;
  scanned_at: string;
  status: EntryStatus;
  type: "ENTRY" | "EXIT";
  location: string;
  full_name: string;
  sap_id: string;
  photo_url: string | null;
  // NEW: Guard information
  guard_name: string | null;
  guard_sap_id: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StatusBadge({
  status,
  type,
}: {
  status: EntryStatus;
  type: "ENTRY" | "EXIT";
}) {
  if (status === "allowed") {
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
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    case "re-entry":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
          <RotateCcw className="h-3 w-3" />
          Re-entry
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function LiveDashboardClient() {
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [stats, setStats] = useState({
    totalEntered: 0,
    currentlyInside: 0,
    rejected: 0,
  });
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // ========================================
  // NEW: Client-Side Search & Pagination State
  // ========================================
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // NEW: Debounce search query with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset to page 1 when search changes
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // NEW: Client-side filtering logic (searches Student Name and SAP ID)
  const filteredEntries = entries.filter((entry) => {
    if (!debouncedSearchQuery.trim()) return true;

    const query = debouncedSearchQuery.toLowerCase();
    const matchesName = entry.full_name.toLowerCase().includes(query);
    const matchesSapId = entry.sap_id.toLowerCase().includes(query);

    return matchesName || matchesSapId;
  });

  // NEW: Pagination logic
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

  // NEW: Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  // ========================================

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch to populate the list
    const fetchInitial = async () => {
      try {
        const response = await fetch("/api/admin/live-scans");
        if (response.ok) {
          const data = await response.json();

          // NEW: Set real-time stats from API instead of starting at 0
          if (data.stats) {
            setStats({
              totalEntered: data.stats.totalEntered,
              currentlyInside: data.stats.currentlyInside,
              rejected: data.stats.rejected,
            });
          }

          // Debug: Log the API response
          console.log("Live scans API response:", data.scans.slice(0, 3));

          // Transform API data to LiveEntry format
          const initialEntries = data.scans.map((scan: any) => ({
            id: scan.id,
            scanned_at: scan.timestamp,
            status:
              scan.status === "GRANTED"
                ? "allowed"
                : scan.status === "REJECTED"
                ? "rejected"
                : "re-entry",
            type: scan.type || "ENTRY", // Fallback to ENTRY if not provided
            location: "Main Gate", // Default for now
            full_name: scan.user.fullName || "Unknown",
            sap_id: scan.user.sapId || "---", // NEW: Now included in API
            photo_url: scan.user.profilePhotoUrl,
            // NEW: Guard information from API (fixed field name)
            guard_name: scan.scanner?.fullName || null,
            guard_sap_id: scan.scanner?.sapId || null,
          }));
          setEntries(initialEntries);
          if (initialEntries.length > 0) {
            setLastScanTime(initialEntries[0].scanned_at);
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial scans:", error);
      }
    };

    fetchInitial();

    // Subscribe to access_logs table changes
    const channel = supabase
      .channel("access_logs_dashboard")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "access_logs",
        },
        async (payload) => {
          const newRecord = payload.new as SupabaseLogRow;

          // Fetch user details separately
          const { data: userData } = await supabase
            .from("users")
            .select("sap_id, full_name, profile_photo_url")
            .eq("id", newRecord.user_id)
            .single();

          if (userData) {
            // Map DB status to UI EntryStatus
            let uiStatus: EntryStatus = "allowed";
            if (newRecord.status === "REJECTED") uiStatus = "rejected";
            if (newRecord.status === "DUPLICATE") uiStatus = "re-entry";

            const newEntry: LiveEntry = {
              id: newRecord.id,
              scanned_at: newRecord.timestamp,
              status: uiStatus,
              type: newRecord.type as "ENTRY" | "EXIT",
              location: newRecord.gate_number || "Main Gate",
              full_name: (userData as any).full_name || "Unknown",
              sap_id: (userData as any).sap_id,
              photo_url: (userData as any).profile_photo_url,
              guard_name: null,
              guard_sap_id: null,
            };

            setEntries((prev) => [newEntry, ...prev].slice(0, 50));
            setLastScanTime(newEntry.scanned_at);

            // Update local stats optimistically
            setStats((prev) => {
              const isEntry = newRecord.type === "ENTRY";
              const isExit = newRecord.type === "EXIT";
              const isGranted = newRecord.status === "GRANTED";
              const isRejected = newRecord.status === "REJECTED";

              return {
                totalEntered:
                  isEntry && isGranted
                    ? prev.totalEntered + 1
                    : prev.totalEntered,
                currentlyInside:
                  isEntry && isGranted
                    ? prev.currentlyInside + 1
                    : isExit && isGranted
                    ? prev.currentlyInside - 1
                    : prev.currentlyInside,
                rejected: isRejected ? prev.rejected + 1 : prev.rejected,
              };
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Live Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Real-time entry tracking and notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Radio
            className={`h-4 w-4 ${
              isConnected ? "text-green-500 animate-pulse" : "text-red-500"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entered Today
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntered}</div>
            <p className="text-xs text-muted-foreground mt-1">* Updates live</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Currently Inside
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.currentlyInside}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected Today
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Scan
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {lastScanTime
                ? new Date(lastScanTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Karachi",
                  })
                : "--:--"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Feed */}
      <Card className="bg-white border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <CardTitle>Live Entry Feed</CardTitle>
          </div>
          <Badge variant="outline" className="animate-pulse">
            {filteredEntries.length} {searchQuery ? "filtered" : "recent"}{" "}
            entries
          </Badge>
        </CardHeader>
        <CardContent>
          {/* NEW: Search Input with Debounce */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Student Name or SAP ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* NEW: Paginated Entry List (replaced old static list) */}
          <div ref={feedRef} className="space-y-3 min-h-[400px]">
            {entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Waiting for scans...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No entries found matching "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              /* OLD RENDERING LOGIC - COMMENTED OUT
              entries.map((entry, index) => (
                <div key={entry.id} ...>
                  ...
                </div>
              ))
              */
              /* NEW: Render paginated and filtered entries */
              paginatedEntries.map((entry, index) => {
                // Check if this entry is the most recent one in the full list
                const isLatest = entries[0]?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    className={`
                      flex items-center justify-between p-4 rounded-lg border border-border
                      transition-all duration-300
                      ${
                        isLatest
                          ? "bg-primary/5 border-primary/20 animate-pulse"
                          : "hover:bg-slate-50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={entry.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(entry.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {entry.full_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <code className="font-mono bg-slate-100 px-1 rounded">
                            {entry.sap_id}
                          </code>
                          <span>•</span>
                          <span>{entry.location}</span>
                          {entry.guard_name && (
                            <>
                              <span>•</span>
                              <span className="text-xs text-primary/70">
                                Guard: {entry.guard_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={entry.status} type={entry.type} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.scanned_at).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                            timeZone: "Asia/Karachi",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* NEW: Pagination Controls */}
          {filteredEntries.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredEntries.length)} of{" "}
                {filteredEntries.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-border rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first, last, current, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center gap-1">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="text-muted-foreground px-1">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1.5 border rounded-md transition-colors ${
                            currentPage === page
                              ? "bg-primary text-white border-primary"
                              : "border-border hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-border rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
