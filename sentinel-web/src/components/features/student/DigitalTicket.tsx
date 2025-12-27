"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useLiveQR, useStudentProfile } from "@/hooks/useStudentTicket";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DigitalTicket() {
  const { data: profile, isLoading: profileLoading } = useStudentProfile();
  const { data: qrData, isLoading: qrLoading, dataUpdatedAt } = useLiveQR();
  const [countdown, setCountdown] = useState(15);

  // Countdown timer for QR validity - reset when QR data updates
  useEffect(() => {
    // Reset countdown when data updates by using a new interval
    const resetCountdown = () => {
      let count = 15;
      setCountdown(count);
      const interval = setInterval(() => {
        count--;
        if (count >= 0) {
          setCountdown(count);
        } else {
          clearInterval(interval);
        }
      }, 1000);
      return interval;
    };

    const interval = resetCountdown();
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  if (profileLoading) {
    return <TicketSkeleton />;
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-slate-600">Unable to load ticket</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-[#4F39F6] to-[#6366F1] px-6 py-5 text-center">
        <p className="text-white/70 text-xs uppercase tracking-widest mb-1">
          Department of Computer Science
        </p>
        <h2 className="text-white text-xl font-bold">Annual Dinner 2026</h2>
        <p className="text-red-900 text-sm mt-1">January 10, 2026</p>
      </div>

      {/* QR Section */}
      <div className="px-6 py-8 flex flex-col items-center">
        {/* Live Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative">
            <Radio className="h-4 w-4 text-[#4F39F6]" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[#4F39F6] rounded-full animate-pulse" />
          </div>
          <span className="text-xs font-medium text-[#4F39F6]">LIVE</span>
        </div>

        {/* QR Code */}
        <div className="p-4 bg-white rounded-2xl border-2 border-[#4F39F6]/20 shadow-lg">
          {qrLoading || !qrData ? (
            <Skeleton className="h-[200px] w-[200px]" />
          ) : (
            <QRCodeSVG
              value={qrData.payload}
              size={200}
              level="H"
              includeMargin={false}
            />
          )}
        </div>

        {/* Countdown Progress */}
        <div className="mt-4 w-full max-w-[200px]">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4F39F6] rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 15) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            Valid for {countdown}s
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="relative px-6">
        <div className="border-t border-dashed border-slate-200" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-slate-50 rounded-r-full" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-slate-50 rounded-l-full" />
      </div>

      {/* Identity Section */}
      <div className="px-6 py-6 flex items-center gap-4">
        {/* Photo */}
        <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-[#4F39F6]/20 shrink-0">
          {profile.profilePhotoUrl ? (
            <Image
              src={profile.profilePhotoUrl}
              alt={profile.fullName || ""}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl font-bold">
              {profile.fullName?.charAt(0) || "?"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <p className="font-bold text-slate-900 text-lg">
            {profile.fullName || "Student"}
          </p>
          <p className="text-slate-500 font-mono text-sm">{profile.sapId}</p>
        </div>

        {/* Status Badge */}
        <div
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
            profile.isPaid
              ? "bg-linear-to-r from-emerald-400 to-emerald-500 text-white"
              : "bg-slate-200 text-slate-500"
          )}
        >
          {profile.isPaid ? (
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Paid
            </span>
          ) : (
            "Pending"
          )}
        </div>
      </div>
    </div>
  );
}

function TicketSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <Skeleton className="h-28 rounded-none" />
      <div className="px-6 py-8 flex flex-col items-center">
        <Skeleton className="h-[200px] w-[200px] rounded-2xl" />
        <Skeleton className="h-2 w-48 mt-6" />
      </div>
      <div className="px-6 py-6 flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  );
}
