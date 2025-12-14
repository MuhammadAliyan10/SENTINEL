"use client";

import { useState, useTransition, useEffect } from "react";
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

export function TicketPricingCard() {
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
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-green-600" />
          Ticket Pricing
        </CardTitle>
        <CardDescription>
          Set the standard price for the event ticket. This affects all future
          financial calculations.
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
            Default is Rs. 2000. Changing this will update the &quot;Cash
            Liability&quot; for all managers immediately.
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
  );
}
