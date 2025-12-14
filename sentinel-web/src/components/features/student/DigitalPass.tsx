"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { WifiOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrPayload, setQrPayload] = useState<string>(initialQrData.payload);
  const [accessState, setAccessState] = useState<AccessState>("LOADING");
  const [isOffline, setIsOffline] = useState(false);
  const [lastEntry, setLastEntry] = useState<Date | null>(null);
  const [hasEnteredBefore, setHasEnteredBefore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track strap paths with state for re-renders
  const [leftPath, setLeftPath] = useState("M 15 0 Q 50 50 50 100");
  const [rightPath, setRightPath] = useState("M 85 0 Q 50 50 50 100");
  const [strapLen, setStrapLen] = useState(120);

  const supabase = useMemo(() => createClient(), []);

  // ============================================
  // PHYSICS - Spring values for smooth return to center
  // ============================================

  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);

  // Spring physics - SMOOTHER return to center
  const springConfig = useMemo(
    () => ({ stiffness: 80, damping: 18, mass: 0.8 }),
    []
  );

  const springX = useSpring(cardX, springConfig);
  const springY = useSpring(cardY, springConfig);

  // Base dimensions - longer strap = card more centered on screen
  const baseStrapLength = isMobile ? 250 : 300;
  const cardWidth = isMobile ? 280 : 320;
  const cardHeight = isMobile ? 420 : 480;

  // ============================================
  // UPDATE STRAPS - Smooth updates using RAF
  // ============================================

  useEffect(() => {
    let rafId: number;

    const updateStraps = () => {
      const x = springX.get();
      const y = springY.get();

      // Strap length increases with Y movement (no limit)
      const newLength = baseStrapLength + y * 0.8;
      setStrapLen(Math.max(80, newLength));

      // BOTH straps end at EXACT CENTER (50) - NO offset
      const centerX = 50;

      // Control points for symmetric professional curves
      const leftCp1X = 35 + (x / cardWidth) * 5;
      const leftCp1Y = 50 + (y / baseStrapLength) * 3;
      const rightCp1X = 65 + (x / cardWidth) * 5;
      const rightCp1Y = 50 + (y / baseStrapLength) * 3;

      // BOTH straps meet at EXACT CENTER (50)
      setLeftPath(`M 25 0 Q ${leftCp1X} ${leftCp1Y} ${centerX} 100`);
      setRightPath(`M 75 0 Q ${rightCp1X} ${rightCp1Y} ${centerX} 100`);

      rafId = requestAnimationFrame(updateStraps);
    };

    rafId = requestAnimationFrame(updateStraps);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [springX, springY, baseStrapLength, cardWidth]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const refreshQrPayload = useCallback(async () => {
    if (isRefreshing || isOffline) return;
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setQrPayload(data.payload);
      }
    } catch {
      // Silent
    } finally {
      setIsRefreshing(false);
    }
  }, [user.id, isRefreshing, isOffline]);

  const checkInitialAccessState = useCallback(async () => {
    try {
      // Check for any ENTRY logs to see if student has entered before
      const { data: entryExists } = await supabase
        .from("access_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "ENTRY")
        .limit(1);

      const hasEntered = entryExists && entryExists.length > 0;
      if (hasEntered) {
        setHasEnteredBefore(true);
      }

      // Get the most recent log to determine current state
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
          // Ensure timestamp is interpreted as UTC (append Z if missing)
          const ts =
            logData.timestamp.endsWith("Z") || logData.timestamp.includes("+")
              ? logData.timestamp
              : logData.timestamp + "Z";
          setLastEntry(new Date(ts));
          setIsFlipped(true); // Auto-flip to show approved stamp
        } else {
          setAccessState("OUTSIDE");
          // If student has entered before and is now outside, flip to show OUTSIDE stamp
          if (hasEntered) {
            setIsFlipped(true);
          }
        }
      } else {
        setAccessState("OUTSIDE");
      }
    } catch {
      setAccessState("OUTSIDE");
    }
  }, [supabase, user.id]);

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
            // Ensure timestamp is interpreted as UTC (append Z if missing)
            const ts =
              newLog.timestamp.endsWith("Z") || newLog.timestamp.includes("+")
                ? newLog.timestamp
                : newLog.timestamp + "Z";
            setLastEntry(new Date(ts));
            setHasEnteredBefore(true);
            setIsFlipped(true); // Auto-flip to show approved stamp
          } else if (newLog.type === "EXIT") {
            setAccessState("OUTSIDE");
            setLastEntry(null);
            setIsFlipped(true); // Keep flipped to show OUTSIDE stamp
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user.id]);

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

  // ============================================
  // DRAG HANDLERS
  // ============================================

  const handleDrag = useCallback(
    (_: unknown, info: { offset: { x: number; y: number } }) => {
      // Update motion values during drag
      cardX.set(info.offset.x);
      cardY.set(info.offset.y);
    },
    [cardX, cardY]
  );

  const handleDragEnd = useCallback(() => {
    // SPRING BACK TO CENTER - This is the key!
    cardX.set(0);
    cardY.set(0);
  }, [cardX, cardY]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // ============================================
  // LOADING STATE
  // ============================================
  if (accessState === "LOADING" || !qrPayload) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isInside = accessState === "INSIDE";
  const strapColor = "#22C55E"; // Green straps

  // Card top position = exactly where straps end
  const cardTop = strapLen;

  return (
    <div
      className="min-h-screen min-h-[100dvh] bg-white flex flex-col items-center relative overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* SVG Straps - ON TOP of card (z-20) */}
      <svg
        className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        style={{
          top: 0,
          width: cardWidth * 1.3,
          height: strapLen,
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Left Strap Shadow */}
        <path
          d={leftPath}
          fill="none"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Left Strap */}
        <path
          d={leftPath}
          fill="none"
          stroke={strapColor}
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Right Strap Shadow */}
        <path
          d={rightPath}
          fill="none"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Right Strap */}
        <path
          d={rightPath}
          fill="none"
          stroke={strapColor}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      {/* Glassmorphic Clip at Top Center - Fixed */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-30"
        style={{ top: strapLen + 3 }}
      >
        <div
          className="
      rounded-lg
      flex items-center justify-center
      backdrop-blur-xl
      border border-white/60
      shadow-lg
    "
          style={{
            width: isMobile ? 50 : 60,
            height: isMobile ? 22 : 26,
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25))",
          }}
        >
          <div className="w-3 h-3 bg-white/70 rounded-full border border-white/80 shadow-inner" />
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        ref={cardRef}
        drag
        dragElastic={0}
        dragMomentum={false}
        initial={{ y: -400 }}
        animate={{ y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
          delay: 0.2,
        }}
        className="absolute z-10 cursor-grab active:cursor-grabbing touch-none"
        style={{
          top: cardTop,
          left: "50%",
          translateX: "-50%",
          x: springX,
          y: springY,
          width: cardWidth,
          height: cardHeight,
        }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={handleFlip}
      >
        {/* Card flip container */}
        <motion.div
          className="relative w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            perspective: 1200,
          }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* ============ FRONT SIDE ============ */}
          <div
            className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Clip hole */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-gray-200 rounded-full shadow-inner z-10" />

            {/* Primary color header */}
            <div className="bg-primary pt-8 pb-4 px-2 text-center">
              <p className="text-white/80 font-mono text-[10px] tracking-[0.15em] uppercase font-medium">
                Department of Computer Science
              </p>
              <h1 className="text-white font-mono text-sm font-bold mt-1 tracking-tight">
                ANNUAL DINNER 2025
              </h1>
            </div>

            {/* Offline banner */}
            {isOffline && (
              <div className="bg-yellow-50 py-2 flex items-center justify-center gap-2 text-yellow-700">
                <WifiOff className="h-3 w-3" />
                <span className="text-xs font-semibold">Offline Mode</span>
              </div>
            )}

            {/* QR Code Section */}
            <div className="flex-1 flex flex-col items-center justify-center mt-5 p-6">
              <div
                className={`p-4 bg-white rounded-2xl border-2 ${
                  isOffline
                    ? "border-yellow-400"
                    : isInside
                    ? "border-emerald-400"
                    : hasEnteredBefore
                    ? "border-blue-400"
                    : "border-gray-200"
                } shadow-lg`}
              >
                <QRCodeSVG
                  value={qrPayload}
                  size={isMobile ? 200 : 220}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>

          {/* ============ BACK SIDE ============ */}
          <div
            className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Clip hole */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-gray-200 rounded-full shadow-inner z-10" />

            {/* Back content */}
            <div className="h-full flex flex-col items-center p-5 pt-8">
              {/* University Logo */}
              <div className="w-45 h-15 overflow-hidden mb-4">
                <Image
                  src="/UniversityLogo.jpeg"
                  alt="University Logo"
                  width={60}
                  height={60}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Student Photo */}
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-3 border-primary/20 shadow-lg mb-3">
                {user.profilePhotoUrl ? (
                  <Image
                    src={user.profilePhotoUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center text-primary font-bold text-xl">
                    {user.fullName?.charAt(0) || "S"}
                  </div>
                )}
              </div>

              {/* Student Info */}
              <div className="text-center space-y-0.5 mb-3">
                <p className="text-base font-bold text-gray-800">
                  {user.fullName || "Student"}
                </p>

                <Badge className="text-xs font-mono">{user.gender}</Badge>
              </div>

              {/* Info Cards */}
              <div className="flex gap-3 w-full">
                {user.section && (
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                      SapId
                    </p>
                    <p className="text-lg font-bold text-gray-800">
                      {user.sapId}
                    </p>
                  </div>
                )}
                {isInside && lastEntry && (
                  <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-emerald-600 uppercase tracking-wider">
                      Entry
                    </p>
                    <p className="text-lg font-bold text-emerald-700">
                      {lastEntry.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: "Asia/Karachi",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Warning Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-red-600 py-2 px-3">
              <p className="text-white text-[9px] text-center font-medium leading-tight">
                ⚠️ Sharing your pass or attempting to bypass security will
                result in rustication
              </p>
            </div>

            {/* APPROVED Stamp Overlay */}
            {isInside && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ scale: 3, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: -12 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.3,
                }}
              >
                <div
                  className="px-8 py-3 border-4 border-emerald-500 rounded-lg"
                  style={{
                    transform: "rotate(-12deg)",
                  }}
                >
                  <p
                    className="text-emerald-500 font-bold text-3xl tracking-widest uppercase"
                    style={{
                      textShadow: "0 0 10px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    APPROVED
                  </p>
                </div>
              </motion.div>
            )}

            {/* OUTSIDE Stamp Overlay - when student has left */}
            {!isInside && hasEnteredBefore && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ scale: 3, opacity: 0, rotate: 15 }}
                animate={{ scale: 1, opacity: 1, rotate: 12 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.3,
                }}
              >
                <div
                  className="px-8 py-3 border-4 border-blue-500 rounded-lg"
                  style={{
                    transform: "rotate(12deg)",
                  }}
                >
                  <p
                    className="text-blue-500 font-bold text-3xl tracking-widest uppercase"
                    style={{
                      textShadow: "0 0 10px rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    OUTSIDE
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Hint */}
      <motion.p
        className="fixed bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-xs font-medium z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ delay: 2, duration: 2, repeat: Infinity }}
      >
        Drag to swing • Tap to flip
      </motion.p>
    </div>
  );
}
