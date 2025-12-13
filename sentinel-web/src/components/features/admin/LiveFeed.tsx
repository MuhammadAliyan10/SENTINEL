"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  status: string;
  gateNumber: string | null;
  user: {
    sapId: string;
    fullName: string | null;
  };
}

interface LiveFeedProps {
  initialLogs: LogEntry[];
}

// Define the shape of the Supabase response
interface SupabaseLogRow {
  id: string;
  timestamp: string;
  status: string;
  gate_number: string | null;
  user_id: string;
}

export function LiveFeed({ initialLogs }: LiveFeedProps) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to access_logs table changes
    const channel = supabase
      .channel("access_logs_realtime")
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
            .select("sap_id, full_name")
            .eq("id", newRecord.user_id)
            .single();

          if (userData) {
            const formattedLog: LogEntry = {
              id: newRecord.id,
              timestamp: new Date(newRecord.timestamp),
              status: newRecord.status,
              gateNumber: newRecord.gate_number,
              user: {
                sapId: (
                  userData as { sap_id: string; full_name: string | null }
                ).sap_id,
                fullName: (
                  userData as { sap_id: string; full_name: string | null }
                ).full_name,
              },
            };

            setLogs((prev) => [formattedLog, ...prev].slice(0, 20));
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "GRANTED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "DUPLICATE":
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GRANTED":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
            Entered
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
            Rejected
          </Badge>
        );
      case "DUPLICATE":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
            Passback
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No entry logs yet</p>
        <p className="text-xs mt-1">
          {isConnected ? "Waiting for scans..." : "Connecting..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {logs.map((log, index) => (
        <div
          key={log.id}
          className={`
            flex items-center justify-between p-3 rounded-lg border border-border
            hover:bg-slate-50 transition-all duration-300
            ${index === 0 ? "bg-primary/5 border-primary/20 animate-pulse" : ""}
          `}
        >
          <div className="flex items-center gap-3">
            {getStatusIcon(log.status)}
            <div>
              <p className="font-mono text-lg font-bold text-primary">
                {log.user.sapId}
              </p>
              <p className="text-xs text-muted-foreground">
                {log.user.fullName || "Unknown"} • {log.gateNumber || "Gate"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge(log.status)}
            <span className="text-xs text-muted-foreground">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
