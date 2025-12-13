"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Ticket, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { loginStudent } from "@/actions/student-auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";

// SECURITY: Validate redirect path to prevent open redirect attacks
function validateRedirectPath(path: string | null): string {
  const defaultPath = "/student/dashboard";
  if (!path) return defaultPath;
  // Must start with /student and not contain protocol or double slashes
  if (
    !path.startsWith("/student") ||
    path.startsWith("//") ||
    path.includes(":")
  ) {
    return defaultPath;
  }
  return path;
}

// Client-side SAP ID validation
function isValidSapId(sapId: string): boolean {
  return /^\d{8}$/.test(sapId);
}

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = validateRedirectPath(searchParams.get("redirect"));

  const [isLoading, setIsLoading] = useState(false);
  const [sapId, setSapId] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sapIdError, setSapIdError] = useState<string | null>(null);

  // Client-side validation on SAP ID blur
  const handleSapIdBlur = () => {
    if (sapId && !isValidSapId(sapId)) {
      setSapIdError("SAP ID must be exactly 8 digits");
    } else {
      setSapIdError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!isValidSapId(sapId)) {
      setError("SAP ID must be exactly 8 digits");
      return;
    }

    if (token.length !== 6) {
      setError("Token must be exactly 6 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("sapId", sapId);
    formData.append("token", token);
    formData.append("redirectTo", redirectPath);

    const res = await loginStudent(formData);

    if (res?.error) {
      setError(res.error);
      toast.error(res.error); // Also show toast for consistency
      setIsLoading(false);
    } else {
      toast.success("Access Granted");
      // Server action handles redirect
    }
  };

  const isFormValid = sapId.length === 8 && token.length === 6;

  return (
    <AuthLayout>
      <AuthCard
        title="Login to get Pass"
        description="Enter your SAP ID and activation code"
        icon={
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
            <Ticket className="w-6 h-6 text-white" />
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="sapId">SAP ID</Label>
            <Input
              id="sapId"
              name="sapId"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{8}"
              autoComplete="off"
              placeholder="Enter your 8-digit SAP ID"
              value={sapId}
              onChange={(e) => {
                // Only allow digits, max 8
                const value = e.target.value.replace(/\D/g, "").slice(0, 8);
                setSapId(value);
                if (sapIdError && isValidSapId(value)) {
                  setSapIdError(null);
                }
              }}
              onBlur={handleSapIdBlur}
              required
              className={`h-11 ${sapIdError ? "border-red-500" : ""}`}
              maxLength={8}
            />
            {sapIdError && <p className="text-xs text-red-500">{sapIdError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Activation Token</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={token}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                onChange={(value) => setToken(value.toUpperCase())}
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot
                    index={0}
                    className="rounded-md w-10 h-12 text-lg font-mono uppercase"
                  />
                  <InputOTPSlot
                    index={1}
                    className="rounded-md w-10 h-12 text-lg font-mono uppercase"
                  />
                  <InputOTPSlot
                    index={2}
                    className="rounded-md w-10 h-12 text-lg font-mono uppercase"
                  />
                  <InputOTPSlot
                    index={3}
                    className="rounded-md w-10 h-12 text-lg font-mono uppercase"
                  />
                  <InputOTPSlot
                    index={4}
                    className="rounded-md w-10 h-12 text-lg font-mono uppercase"
                  />
                  <InputOTPSlot
                    index={5}
                    className="rounded-md w-10 h-12 text-lg font-mono uppercase"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Enter the 6-character code from your pass
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full h-11 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Get My Pass"
            )}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <StudentLoginForm />
    </Suspense>
  );
}
