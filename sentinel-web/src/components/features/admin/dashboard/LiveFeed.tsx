"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Radio, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LiveScan {
  id: string;
  timestamp: Date | string;
  status: "GRANTED" | "REJECTED" | "DUPLICATE";
  user: {
    fullName: string | null;
    profilePhotoUrl: string | null;
  };
}

interface LiveFeedProps {
  initialData: LiveScan[];
}

export function LiveFeed({ initialData }: LiveFeedProps) {
  const [scans, setScans] = useState<LiveScan[]>(initialData);
  const [isPolling, setIsPolling] = useState(true);

  // Poll every 5 seconds
  useEffect(() => {
    if (!isPolling) return;

    const fetchLatest = async () => {
      try {
        const response = await fetch("/api/admin/live-scans");
        if (response.ok) {
          const data = await response.json();
          setScans(data.scans);
        }
      } catch (error) {
        console.error("Failed to fetch live scans:", error);
      }
    };

    const interval = setInterval(fetchLatest, 5000);
    return () => clearInterval(interval);
  }, [isPolling]);

  const getStatusConfig = (status: LiveScan["status"]) => {
    switch (status) {
      case "GRANTED":
        return {
          bg: "bg-white",
          text: "text-emerald-600",
          label: "Entered",
        };
      case "REJECTED":
        return {
          bg: "bg-red-50",
          text: "text-red-600",
          label: "DENIED",
        };
      case "DUPLICATE":
        return {
          bg: "bg-amber-50",
          text: "text-amber-600",
          label: "DOUBLE SCAN",
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="h-5 w-5 text-[#4F39F6]" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[#4F39F6] rounded-full animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Live Gate Activity
          </h3>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/logs" className="text-[#4F39F6]">
            <Eye className="h-4 w-4 mr-1" />
            View All
          </Link>
        </Button>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto">
        {scans.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {scans.slice(0, 5).map((scan) => {
              const config = getStatusConfig(scan.status);
              return (
                <div
                  key={scan.id}
                  className={cn(
                    "flex items-center gap-3 p-4 transition-colors",
                    config.bg
                  )}
                >
                  {/* Avatar */}
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                    {scan.user.profilePhotoUrl ? (
                      <Image
                        src={scan.user.profilePhotoUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 font-medium">
                        {scan.user.fullName?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {scan.user.fullName || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(scan.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: "Asia/Karachi",
                      })}
                    </p>
                  </div>

                  {/* Status */}
                  <span className={cn("text-xs font-semibold", config.text)}>
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
