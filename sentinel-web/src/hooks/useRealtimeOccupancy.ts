"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Hook to subscribe to realtime access log changes for live occupancy tracking.
 *
 * @param initialValue - Initial occupancy count from server
 * @returns Object containing current occupancy and connection status
 */
export function useRealtimeOccupancy(initialValue: number) {
  const [occupancy, setOccupancy] = useState(initialValue);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    const subscribe = async () => {
      channel = supabase
        .channel("access_logs_changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "access_logs" },
          (payload) => {
            const { type, status } = payload.new as {
              type: string;
              status: string;
            };

            // Only count GRANTED scans
            if (status !== "GRANTED") return;

            setOccupancy((prev) => {
              if (type === "ENTRY") {
                return prev + 1;
              } else if (type === "EXIT") {
                return Math.max(0, prev - 1);
              }
              return prev;
            });
          }
        )
        .subscribe((status) => {
          setIsConnected(status === "SUBSCRIBED");
        });
    };

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { occupancy, isConnected };
}
