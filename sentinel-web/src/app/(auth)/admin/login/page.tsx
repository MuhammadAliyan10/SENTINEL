"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  getUserRole,
  logSuccessfulLogin,
  logFailedLogin,
} from "@/actions/auth-actions";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";

// SECURITY: Validate redirect path to prevent open redirect attacks
function validateRedirectPath(path: string | null): string {
  const defaultPath = "/admin";
  if (!path) return defaultPath;
  // Must start with /admin and not contain protocol or double slashes
  if (
    !path.startsWith("/admin") ||
    path.startsWith("//") ||
    path.includes(":")
  ) {
    return defaultPath;
  }
  return path;
}

function AdminLoginForm() {
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

    // Client-side validation
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
        await logFailedLogin(email, authError.message);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        await logFailedLogin(email, "No user returned");
        throw new Error("Authentication failed");
      }

      // Role Check (Client-side optimization)
      const role = authData.user.user_metadata?.role;
      if (role !== "SUPER_ADMIN") {
        await supabase.auth.signOut();
        await logFailedLogin(email, "Unauthorized role: " + role);
        throw new Error("Access Denied: Administrator privileges required");
      }

      // Log successful login
      await logSuccessfulLogin(authData.user.id, "SUPER_ADMIN");

      toast.success("Welcome back, Commander");
      // Use full page reload to ensure session is recognized
      window.location.href = redirectPath;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      setError(message);
      toast.error(message);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Command Center"
        description="Restricted Access. All actions are monitored."
        icon={
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/30">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@sentinel.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passcode</Label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium h-11 shadow-lg shadow-red-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Access Terminal"
            )}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
