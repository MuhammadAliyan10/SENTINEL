"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  RefreshCw,
  User,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { generateTimeToken } from "@/actions/security-actions";

interface StudentProfile {
  id: string;
  full_name: string;
  sap_id: string;
  role: string;
  payment_status: boolean;
  photo_url: string | null;
}

interface StudentPassClientProps {
  profile: StudentProfile;
}

export function StudentPassClient({ profile }: StudentPassClientProps) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentCode, setCurrentCode] = useState("------");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate TOTP code using server action
  const generateCode = useCallback(async () => {
    if (!profile.payment_status) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateTimeToken();

      if (result.success && result.code) {
        setCurrentCode(result.code);
        if (result.expiresIn) {
          setTimeLeft(result.expiresIn);
        }
      } else {
        setError(result.message || "Failed to generate code");
        setCurrentCode("------");
      }
    } catch (err) {
      setError("Failed to generate code");
      setCurrentCode("------");
    } finally {
      setIsGenerating(false);
    }
  }, [profile.payment_status]);

  // Timer countdown effect (TOTP rotates every 30 seconds)
  useEffect(() => {
    // Calculate initial remaining time
    const now = Math.floor(Date.now() / 1000);
    const remaining = 30 - (now % 30);
    setTimeLeft(remaining);

    // Generate initial code
    generateCode();

    const interval = setInterval(() => {
      const current = Math.floor(Date.now() / 1000);
      const newRemaining = 30 - (current % 30);
      setTimeLeft(newRemaining);

      // When timer resets, regenerate the TOTP
      if (newRemaining === 30) {
        generateCode();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [generateCode]);

  // Payment Pending View
  if (!profile.payment_status) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-inset bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200/50 mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Payment Required
          </h1>
        </div>

        <Card className="w-full max-w-sm bg-white border-border shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg">
                  {profile.full_name}
                </h2>
                <p className="font-mono text-2xl font-bold text-white/90 tracking-widest">
                  {profile.sap_id}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Badge className="bg-red-500/80 text-white border-red-400/50">
                Payment Pending
              </Badge>
            </div>
          </div>

          <div className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Your access pass is currently inactive. Please complete your fee
              payment to activate your pass.
            </p>
            <Button variant="outline" className="w-full">
              Contact Administration
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-inset">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Sentinel Pass</h1>
        <p className="text-muted-foreground text-sm">
          University Access Control
        </p>
      </div>

      {/* Pass Card */}
      <Card className="w-full max-w-sm bg-white border-border shadow-xl overflow-hidden">
        {/* Student Info Header */}
        <div className="bg-gradient-to-r from-primary to-accent-foreground p-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </div>

            {/* Name and SAP ID */}
            <div className="flex-1">
              <h2 className="text-white font-semibold text-lg">
                {profile.full_name}
              </h2>
              {/* SAP ID - Large Bold Monospace */}
              <p className="font-mono text-2xl font-bold text-white tracking-widest">
                {profile.sap_id}
              </p>
            </div>
          </div>

          {/* Payment Status */}
          <div className="mt-3 flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/30 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Fees Paid
            </Badge>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-6 flex flex-col items-center bg-white">
          {/* QR Code Placeholder */}
          <div className="w-52 h-52 bg-slate-50 border-2 border-border rounded-xl flex items-center justify-center mb-4 relative">
            {isGenerating ? (
              <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            ) : error ? (
              <div className="text-center p-4">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : (
              <div className="text-muted-foreground text-center p-4">
                <div className="w-36 h-36 bg-white border border-slate-200 rounded-lg flex items-center justify-center mx-auto">
                  {/* QR Code would render here */}
                  <div className="text-xs text-center text-muted-foreground">
                    <p className="font-mono font-bold text-foreground">
                      {currentCode}
                    </p>
                    <p className="mt-1">Scan at gate</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <span className="text-sm">Refreshes in</span>
            <span
              className={`font-mono text-xl font-bold ${
                timeLeft <= 5 ? "text-destructive" : "text-primary"
              }`}
            >
              {timeLeft.toString().padStart(2, "0")}s
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                timeLeft <= 5
                  ? "bg-destructive"
                  : "bg-gradient-to-r from-primary to-accent-foreground"
              }`}
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            />
          </div>

          {/* Current TOTP Code Display */}
          <div className="mt-4 w-full p-4 bg-slate-50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground text-center mb-1">
              Verification Code
            </p>
            <p className="font-mono text-3xl font-bold text-foreground tracking-[0.3em] text-center">
              {currentCode}
            </p>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <p className="text-muted-foreground text-xs mt-8 text-center max-w-xs">
        Present this code at gate scanners. Code refreshes every 30 seconds for
        security.
      </p>
    </div>
  );
}
