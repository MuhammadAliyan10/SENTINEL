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
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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

export function LiveDashboardClient() {
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
            <div className="text-2xl font-bold">{totalEntered}</div>
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
              {Math.floor(totalEntered * 0.7)}
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
              {entries.filter((e) => e.status === "rejected").length}
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
                ? new Date(lastScanTime).toLocaleTimeString()
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
            {entries.length} entries
          </Badge>
        </CardHeader>
        <CardContent>
          <div
            ref={feedRef}
            className="space-y-3 max-h-[500px] overflow-y-auto"
          >
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg border border-border
                  transition-all duration-300
                  ${
                    index === 0
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
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={entry.status} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.scanned_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
