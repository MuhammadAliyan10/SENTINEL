"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import {
  WifiOff,
  Loader2,
  CheckCircle2,
  PartyPopper,
  ShieldCheck,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface UserProfile {
  id: string;
  sapId: string;
  fullName: string | null;
  profilePhotoUrl: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  section: string | null;
}

interface DigitalPassProps {
  user: UserProfile;
  initialQrData: {
    payload: string;
    expiresAt: number;
  };
}

type AccessState = "OUTSIDE" | "INSIDE" | "LOADING";

// ============================================
// COMPONENT
// ============================================

export default function DigitalPass({ user, initialQrData }: DigitalPassProps) {
  // ----------------------------------------
  // STATE
  // ----------------------------------------
  const [qrPayload, setQrPayload] = useState<string>(initialQrData.payload);
  const [accessState, setAccessState] = useState<AccessState>("LOADING");
  const [isOffline, setIsOffline] = useState(false);
  const [lastEntry, setLastEntry] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const supabase = createClient();
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ----------------------------------------
  // SECURITY: LIVE CLOCK (Anti-Screenshot)
  // ----------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ----------------------------------------
  // QR CODE REFRESH (Server-side generation)
  // ----------------------------------------
  const refreshQrPayload = useCallback(async () => {
    if (isRefreshing || isOffline) return;

    setIsRefreshing(true);
    try {
      // Fetch new QR code from server API
      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrPayload(data.payload);
      }
    } catch (error) {
      console.error("Failed to refresh QR:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user.id, isRefreshing, isOffline]);

  // ----------------------------------------
  // INITIAL ACCESS STATE CHECK
  // ----------------------------------------
  const checkInitialAccessState = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("access_logs")
        .select("type, timestamp")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        const logData = data as { type: string; timestamp: string };
        if (logData.type === "ENTRY") {
          setAccessState("INSIDE");
          setLastEntry(new Date(logData.timestamp));
        } else {
          setAccessState("OUTSIDE");
        }
      } else {
        setAccessState("OUTSIDE");
      }
    } catch (err) {
      console.error("Initial state check failed:", err);
      setAccessState("OUTSIDE");
    }
  }, [supabase, user.id]);

  // ----------------------------------------
  // REALTIME SUBSCRIPTION
  // ----------------------------------------
  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel(`access-logs-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "access_logs",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newLog = payload.new as { type: string; timestamp: string };

          if (newLog.type === "ENTRY") {
            setAccessState("INSIDE");
            setLastEntry(new Date(newLog.timestamp));
          } else if (newLog.type === "EXIT") {
            setAccessState("OUTSIDE");
            setLastEntry(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user.id]);

  // ----------------------------------------
  // CONNECTIVITY MONITORING
  // ----------------------------------------
  const setupConnectivityMonitor = useCallback(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ----------------------------------------
  // EFFECTS
  // ----------------------------------------
  useEffect(() => {
    qrIntervalRef.current = setInterval(refreshQrPayload, 15000);
    checkInitialAccessState();
    const unsubscribeRealtime = setupRealtimeSubscription();
    const unsubscribeConnectivity = setupConnectivityMonitor();

    return () => {
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
      unsubscribeRealtime();
      unsubscribeConnectivity();
    };
  }, [
    refreshQrPayload,
    checkInitialAccessState,
    setupRealtimeSubscription,
    setupConnectivityMonitor,
  ]);

  // ----------------------------------------
  // RENDER: Loading State
  // ----------------------------------------
  if (accessState === "LOADING" || !qrPayload) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // ----------------------------------------
  // RENDER: Inside State (Entry Success)
  // ----------------------------------------
  if (accessState === "INSIDE") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-4 overflow-hidden">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <PartyPopper className="h-10 w-10 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome!</h1>
            <p className="text-slate-500 mt-1">{user.fullName || "Guest"}</p>
          </div>
          {lastEntry && (
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-emerald-600 uppercase font-medium">
                Entered At
              </p>
              <p className="text-lg font-mono font-bold text-emerald-700">
                {lastEntry.toLocaleTimeString("en-US", { hour12: true })}
              </p>
            </div>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            You&apos;re Inside
          </div>
          <p className="text-xs text-slate-400">
            Scan again at exit to check out
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // RENDER: Outside State (Show QR)
  // ----------------------------------------
  return (
    <div
      className="h-screen flex flex-col items-center justify-center bg-gray-50 p-4 overflow-hidden"
      onContextMenu={(e) => e.preventDefault()} // Disable Right Click
    >
      {/* SECURITY: Pulsing Background Animation */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent animate-pulse-slow" />
      </div>

      {/* Pass Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden z-10 relative border border-white/10">
        {/* Live Header */}
        {/* Offline Indicator (Non-blocking) */}
        {isOffline && (
          <div className="bg-yellow-50 p-3 border-b border-yellow-100 flex items-center justify-center gap-2 text-yellow-700 animate-in slide-in-from-top duration-300">
            <WifiOff className="h-4 w-4" />
            <span className="text-xs font-semibold">
              Offline Mode • Using last valid code
            </span>
          </div>
        )}

        {/* User Info */}
        <div className="p-6 pb-2 text-center bg-white">
          <div className="relative w-24 h-24 mx-auto mb-3">
            {user.profilePhotoUrl ? (
              <Image
                src={user.profilePhotoUrl}
                alt="Profile"
                fill
                className="rounded-full object-cover border-4 border-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-200" />
            )}
            {/* Active Indicator */}
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-bounce" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 truncate">
            {user.fullName}
          </h2>
          <p className="text-sm text-slate-500 font-mono mt-1">{user.sapId}</p>
        </div>

        {/* QR Code Section */}
        <div className="p-6 pt-2 bg-white flex flex-col items-center">
          <div
            className={cn(
              "p-4 bg-white rounded-xl border-4 transition-all duration-300 shadow-inner",
              isOffline ? "border-yellow-400" : "border-primary/20"
            )}
          >
            <div className="relative">
              <QRCodeSVG
                value={qrPayload}
                size={320}
                level="H"
                includeMargin={true}
                className="rounded-lg"
              />
              {/* Holographic Overlay Effect (CSS) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 animate-shimmer pointer-events-none" />
            </div>
          </div>

          {/* Status Text */}
          <div className="mt-4 flex items-center gap-2">
            {isRefreshing ? (
              <span className="text-xs text-primary flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Refreshing code...
              </span>
            ) : isOffline ? (
              <span className="text-xs text-yellow-600 flex items-center gap-1 font-medium">
                <WifiOff className="h-3 w-3" />
                Offline • Auto-reconnects
              </span>
            ) : (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Code • Auto-updates
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Background Date Watermark */}
      {/* <div className="absolute bottom-8 text-slate-800/50 font-black text-6xl tracking-tighter pointer-events-none z-0">
        {currentTime.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </div> */}
    </div>
  );
}
