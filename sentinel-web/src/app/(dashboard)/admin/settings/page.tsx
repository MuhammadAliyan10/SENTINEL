"use client";

import { useState, useEffect } from "react";
import { getTicketPrice, updateTicketPrice } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const [price, setPrice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTicketPrice().then((p) => {
      setPrice(p.toString());
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const numPrice = parseInt(price, 10);
    if (isNaN(numPrice)) {
      toast.error("Invalid price");
      setSaving(false);
      return;
    }

    const res = await updateTicketPrice(numPrice);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Pricing</CardTitle>
          <CardDescription>
            Set the price for a single student pass. This affects all future
            calculations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (PKR)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 2000"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
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
  );
}
