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
import { Ticket, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { loginStudent } from "@/actions/student-auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/student/dashboard";

  const [isLoading, setIsLoading] = useState(false);
  const [sapId, setSapId] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("sapId", sapId);
    formData.append("token", token);

    const res = await loginStudent(formData);

    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      toast.success("Access Granted");
    }
  };

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
              autoComplete="off"
              placeholder="Enter your SAP ID"
              value={sapId}
              onChange={(e) => setSapId(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Activation Token</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={token}
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
            disabled={isLoading || token.length < 6}
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
