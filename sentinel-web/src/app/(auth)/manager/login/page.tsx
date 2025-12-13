"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  getUserRole,
  logSuccessfulLogin,
  logFailedLogin,
} from "@/actions/auth-actions";
import Image from "next/image";

// SECURITY: Validate redirect path to prevent open redirect attacks
function validateRedirectPath(path: string | null): string {
  const defaultPath = "/manager/dashboard";
  if (!path) return defaultPath;
  if (
    !path.startsWith("/manager") ||
    path.startsWith("//") ||
    path.includes(":")
  ) {
    return defaultPath;
  }
  return path;
}

function ManagerLoginForm() {
  const searchParams = useSearchParams();
  const redirectPath = validateRedirectPath(searchParams.get("redirect"));

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        logFailedLogin(email, authError.message);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        logFailedLogin(email, "No user returned");
        throw new Error("Authentication failed");
      }

      const role = await getUserRole();

      if (role !== "CR" && role !== "GR" && role !== "SUPER_ADMIN") {
        await supabase.auth.signOut();
        logFailedLogin(email, "Unauthorized role: " + role);
        throw new Error("Access Denied: Manager privileges required");
      }

      logSuccessfulLogin(authData.user.id, role);

      toast.success("Welcome, Manager");
      window.location.href = redirectPath;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      setError(message);
      toast.error(message);
      setIsLoading(false);
    }
  };

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
              className=""
              priority
            />
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Login as Manager
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

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 text-lg bg-background border-2 border-muted focus:border-primary"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 text-lg bg-background border-2 border-muted focus:border-primary"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Enter Portal"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Manager portal for CR/GR only
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ManagerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ManagerLoginForm />
    </Suspense>
  );
}
