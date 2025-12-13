"use client";

import { useState } from "react";
import { loginStudent } from "@/actions/student-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function StudentLoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const res = await loginStudent(formData);
    if (res?.error) {
      toast.error(res.error);
      setIsLoading(false);
    }
    // If success, the server action redirects, so we don't need to do anything
  }

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
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                SAP ID
              </label>
              <Input
                name="sapId"
                placeholder="e.g. 70168915"
                className="bg-slate-950 border-slate-800 text-white h-12 text-lg placeholder:text-slate-600"
                type="number"
                pattern="\d*"
                required
              />
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
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
              disabled={isLoading}
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
