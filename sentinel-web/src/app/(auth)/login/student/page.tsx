"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loginStudent } from "@/actions/student-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Ticket, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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

function StudentLoginContent() {
  const searchParams = useSearchParams();
  const redirectPath = validateRedirectPath(searchParams.get("redirect"));

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sapId, setSapId] = useState("");
  const [token, setToken] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation
    if (!/^\d{8}$/.test(sapId)) {
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
    formData.append("token", token.toUpperCase());
    formData.append("redirectTo", redirectPath);

    const res = await loginStudent(formData);

    if (res?.error) {
      setError(res.error);
      toast.error(res.error);
      setIsLoading(false);
    } else {
      toast.success("Access Granted");
      // Server action handles redirect
    }
  }

  const isFormValid = /^\d{8}$/.test(sapId) && token.length === 6;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-50 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
            <Ticket className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">
            Digital Pass
          </CardTitle>
          <p className="text-slate-400">
            Enter your SAP ID and the 6-character token provided by your Class
            Rep.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="bg-red-950 border-red-900"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                SAP ID
              </label>
              <Input
                name="sapId"
                placeholder="e.g. 70168915"
                className="bg-slate-950 border-slate-800 text-white h-12 text-lg placeholder:text-slate-600"
                type="text"
                inputMode="numeric"
                pattern="\d{8}"
                maxLength={8}
                value={sapId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 8);
                  setSapId(value);
                }}
                required
              />
              <p className="text-xs text-slate-500">Must be exactly 8 digits</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Activation Token
              </label>
              <Input
                name="token"
                placeholder="e.g. X7K9P2"
                className="bg-slate-950 border-slate-800 text-white h-12 text-lg font-mono tracking-widest uppercase placeholder:text-slate-600"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                required
              />
              <p className="text-xs text-slate-500">
                6 characters from your CR/GR
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Access Portal"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            <p>Lost your token?</p>
            <p>Contact your Class Representative (CR/GR)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <StudentLoginContent />
    </Suspense>
  );
}
