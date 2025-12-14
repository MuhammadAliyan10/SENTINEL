"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { issuePass } from "@/actions/manager-actions";
import { UserPlus, Loader2, Check, Copy } from "lucide-react";

interface RegistrationFormProps {
  ticketPrice: number;
}

export function RegistrationForm({ ticketPrice }: RegistrationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [sapId, setSapId] = useState("");
  const [fullName, setFullName] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    token?: string;
    studentName?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sapId || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }

    startTransition(async () => {
      const response = await issuePass(sapId, fullName);

      if (response.success) {
        setResult({
          success: true,
          token: response.token,
          studentName: response.studentName,
        });
        setSapId("");
        setFullName("");
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    });
  };

  const handleCopyToken = async () => {
    if (result?.token) {
      await navigator.clipboard.writeText(result.token);
      setCopied(true);
      toast.success("Token copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewRegistration = () => {
    setResult(null);
    setCopied(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Cash Desk</h3>
            <p className="text-sm text-slate-500">Register new student</p>
          </div>
          <div className="px-3 py-1.5 bg-[#4F39F6]/10 rounded-lg">
            <p className="text-sm font-semibold text-[#4F39F6]">
              {formatCurrency(ticketPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {result?.success ? (
          // Success View
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-1">
              Registration Complete!
            </h4>
            <p className="text-sm text-slate-500 mb-4">
              {result.studentName} has been registered
            </p>

            {/* Token Display */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-500 mb-2">Activation Token</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-mono font-bold text-[#4F39F6] tracking-widest">
                  {result.token}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyToken}
                  className="p-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Give this token to the student
              </p>
            </div>

            <Button
              onClick={handleNewRegistration}
              className="w-full bg-[#4F39F6] hover:bg-[#4F39F6]/90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Register Another
            </Button>
          </div>
        ) : (
          // Form View
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sapId" className="text-slate-700">
                SAP ID
              </Label>
              <Input
                id="sapId"
                type="text"
                placeholder="e.g., 70168915"
                value={sapId}
                onChange={(e) => setSapId(e.target.value)}
                className="border-slate-200 focus:border-[#4F39F6] focus:ring-[#4F39F6]"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="e.g., Muhammad Aliyan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-slate-200 focus:border-[#4F39F6] focus:ring-[#4F39F6]"
                disabled={isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#4F39F6] hover:bg-[#4F39F6]/90"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register & Collect {formatCurrency(ticketPrice)}
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
