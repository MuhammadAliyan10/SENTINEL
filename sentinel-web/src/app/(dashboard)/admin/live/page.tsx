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
} from "lucide-react";
import type { EntryStatus, EntryLogDetailed } from "@/types/database";

// Mock data for demonstration - will be replaced with Supabase Realtime
const generateMockEntry = (): EntryLogDetailed => {
  const names = [
    "Ahmed Khan",
    "Sara Ali",
    "Muhammad Zain",
    "Fatimah Hassan",
    "Ali Raza",
    "Ayesha Malik",
    "Hassan Ahmed",
    "Zainab Qureshi",
  ];
  const statuses: EntryStatus[] = [
    "allowed",
    "allowed",
    "allowed",
    "allowed",
    "rejected",
    "re-entry",
  ];
  const locations = [
    "Main Gate",
    "Library Entrance",
    "CS Building",
    "Engineering Block",
  ];

  const name = names[Math.floor(Math.random() * names.length)];
  const sapId = `7${Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, "0")}`;

  return {
    id: Date.now().toString(),
    scanned_at: new Date().toISOString(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    guard_device_id: `GATE-${Math.floor(Math.random() * 3) + 1}`,
    location: locations[Math.floor(Math.random() * locations.length)],
    notes: null,
    full_name: name,
    sap_id: sapId,
    photo_url: null,
    payment_status: Math.random() > 0.2,
  };
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StatusBadge({ status }: { status: EntryStatus }) {
  switch (status) {
    case "allowed":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Entered
        </Badge>
      );
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
  }
}

export default function LiveDashboardPage() {
  const [entries, setEntries] = useState<EntryLogDetailed[]>([]);
  const [totalEntered, setTotalEntered] = useState(142);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  // Simulate real-time entries (replace with Supabase Realtime in production)
  useEffect(() => {
    // Add initial entries
    const initial = Array.from({ length: 5 }, generateMockEntry);
    setEntries(initial);
    setLastScanTime(initial[0]?.scanned_at || null);

    // Simulate new entries coming in
    const interval = setInterval(() => {
      const newEntry = generateMockEntry();
      setEntries((prev) => [newEntry, ...prev].slice(0, 50)); // Keep last 50
      setLastScanTime(newEntry.scanned_at);

      if (newEntry.status === "allowed") {
        setTotalEntered((prev) => prev + 1);
      }
    }, 5000); // New entry every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // TODO: Replace with actual Supabase Realtime subscription
  // useEffect(() => {
  //   const supabase = createClient();
  //
  //   const channel = supabase
  //     .channel("entry_logs")
  //     .on(
  //       "postgres_changes",
  //       { event: "INSERT", schema: "public", table: "entry_logs" },
  //       async (payload) => {
  //         // Fetch the detailed entry with user info
  //         const { data } = await supabase
  //           .from("v_entry_logs_detailed")
  //           .select("*")
  //           .eq("id", payload.new.id)
  //           .single();
  //
  //         if (data) {
  //           setEntries((prev) => [data, ...prev].slice(0, 50));
  //           setLastScanTime(data.scanned_at);
  //           if (data.status === "allowed") {
  //             setTotalEntered((prev) => prev + 1);
  //           }
  //         }
  //       }
  //     )
  //     .subscribe((status) => {
  //       setIsConnected(status === "SUBSCRIBED");
  //     });
  //
  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Live Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time entry feed from all gates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entered Today
            </CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {totalEntered}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Zap className="h-3 w-3" />
              Live count
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Scan
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {lastScanTime
                ? new Date(lastScanTime).toLocaleTimeString()
                : "--:--:--"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastScanTime
                ? new Date(lastScanTime).toLocaleDateString()
                : "No scans yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Gates
            </CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Radio className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              GATE-01, GATE-02, GATE-03
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Feed */}
      <Card className="bg-white border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Live Entry Feed</CardTitle>
          </div>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Real-time
          </Badge>
        </CardHeader>
        <CardContent>
          <div
            ref={feedRef}
            className="space-y-3 max-h-[500px] overflow-y-auto"
          >
            {entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Waiting for entries...</p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border border-border
                    hover:bg-slate-50 transition-all duration-300
                    ${
                      index === 0
                        ? "animate-fade-in bg-primary/5 border-primary/20"
                        : ""
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={entry.photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(entry.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div>
                      <p className="font-medium text-foreground">
                        {entry.full_name}
                      </p>
                      {/* SAP ID - Large Bold Monospace */}
                      <p className="font-mono text-2xl font-bold text-primary tracking-widest">
                        {entry.sap_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.location} • {entry.guard_device_id}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={entry.status} />
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.scanned_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
