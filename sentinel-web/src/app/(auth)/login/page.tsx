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
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { loginStudent } from "@/actions/student-auth";
import Image from "next/image";

// SECURITY: Validate redirect path to prevent open redirect attacks
function validateRedirectPath(path: string | null): string {
  const defaultPath = "/student/dashboard";
  if (!path) return defaultPath;
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

  const handleSapIdBlur = () => {
    if (sapId && !isValidSapId(sapId)) {
      setSapIdError("SAP ID must be exactly 8 digits");
    } else {
      setSapIdError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      toast.error(res.error);
      setIsLoading(false);
    } else {
      toast.success("Access Granted");
    }
  };

  const isFormValid = sapId.length === 8 && token.length === 6;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm space-y-8">
          {/* University Logo */}
          <div className="flex justify-center">
            <Image
              src="/UniversityLogo.jpeg"
              alt="University Logo"
              width={220}
              height={120}
              priority
            />
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Login to Get Pass
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-destructive/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* SAP ID Field */}
            <div className="space-y-2">
              <Label htmlFor="sapId" className="text-sm font-medium">
                SAP ID
              </Label>
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
                  const value = e.target.value.replace(/\D/g, "").slice(0, 8);
                  setSapId(value);
                  if (sapIdError && isValidSapId(value)) {
                    setSapIdError(null);
                  }
                }}
                onBlur={handleSapIdBlur}
                required
                className={`h-14 text-lg bg-background border-2 focus:border-primary ${
                  sapIdError ? "border-destructive" : "border-muted"
                }`}
                maxLength={8}
              />
              {sapIdError && (
                <p className="text-xs text-destructive">{sapIdError}</p>
              )}
            </div>

            {/* Activation Token */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Activation Token</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={token}
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                  onChange={(value) => setToken(value.toUpperCase())}
                  inputMode="text"
                  autoCapitalize="characters"
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="w-12 h-14 text-xl font-mono font-bold uppercase border-2 border-gray-150 focus:border-primary rounded-lg bg-background"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-character code from your CR/GR
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
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

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have a token? Contact your CR/GR
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <StudentLoginForm />
    </Suspense>
  );
}
