"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ShieldCheck, ShieldAlert, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  timestamp: string;
  status: "GRANTED" | "REJECTED" | "DUPLICATE";
  gate_number: string | null;
  user_id: string;
}

export function LiveFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const channel = supabase
      .channel("access_logs_feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "access_logs",
          filter: "status=in.(GRANTED,REJECTED,DUPLICATE)", // Filter to reduce noise
        },
        (payload) => {
          const newLog = payload.new as LogEntry;
          setLogs((prev) => [newLog, ...prev].slice(0, 10)); // Keep last 10
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("LiveFeed connected");
        } else if (status === "CHANNEL_ERROR") {
          console.error("LiveFeed connection error - check RLS policies");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[320px] px-4">
          <div className="space-y-4 pb-4">
            {logs.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                Waiting for live activity...
              </div>
            )}
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 animate-in slide-in-from-top-2 fade-in duration-300"
              >
                <div
                  className={cn(
                    "p-2 rounded-full shrink-0",
                    log.status === "GRANTED"
                      ? "bg-green-100 text-green-600"
                      : log.status === "REJECTED"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  )}
                >
                  {log.status === "GRANTED" ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : log.status === "REJECTED" ? (
                    <ShieldAlert className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {log.status === "GRANTED"
                      ? "Access Granted"
                      : log.status === "REJECTED"
                      ? "Access Denied"
                      : "Duplicate Scan"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{log.gate_number || "Main Gate"}</span>
                    <span className="font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
