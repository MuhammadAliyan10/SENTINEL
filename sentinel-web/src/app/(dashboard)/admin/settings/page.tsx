"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Banknote } from "lucide-react";
import { updateTicketPrice, getTicketPrice } from "@/actions/settings-actions";
import { useEffect } from "react";

export default function SettingsPage() {
  const [price, setPrice] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getTicketPrice().then((p) => {
      setPrice(p.toString());
      setIsLoading(false);
    });
  }, []);

  const handleSave = () => {
    const newPrice = parseInt(price, 10);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error("Please enter a valid positive price");
      return;
    }

    startTransition(async () => {
      const res = await updateTicketPrice(newPrice);
      if (res.success) {
        toast.success("Ticket price updated successfully");
      } else {
        toast.error(res.error || "Failed to update price");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          System Settings
        </h2>
        <p className="text-slate-500">
          Manage global configuration for the Sentinel system.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              Ticket Pricing
            </CardTitle>
            <CardDescription>
              Set the standard price for the event ticket. This affects all
              future financial calculations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="price">Ticket Price (PKR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1.5 text-slate-500 font-medium">
                  Rs.
                </span>
                <Input
                  id="price"
                  type="number"
                  placeholder="2000"
                  className="pl-10"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500">
                Default is Rs. 2000. Changing this will update the "Cash
                Liability" for all managers immediately.
              </p>
            </div>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
