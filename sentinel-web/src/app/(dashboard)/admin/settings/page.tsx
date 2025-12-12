import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Key, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure system preferences and security options
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Supabase Configuration */}
        <Card className="bg-white border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>Supabase Configuration</CardTitle>
            </div>
            <CardDescription>
              Database and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabaseUrl">Supabase URL</Label>
              <Input
                id="supabaseUrl"
                placeholder="https://your-project.supabase.co"
                defaultValue=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabaseKey">Anon Key</Label>
              <Input
                id="supabaseKey"
                type="password"
                placeholder="••••••••••••••••"
              />
            </div>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-white border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailAlerts">Email Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email for rejected entries
                </p>
              </div>
              <Switch id="emailAlerts" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="paymentAlerts">Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Alert for unpaid students
                </p>
              </div>
              <Switch id="paymentAlerts" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dailyReport">Daily Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive daily entry statistics
                </p>
              </div>
              <Switch id="dailyReport" />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-white border-border shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>
              TOTP and access control configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="totpWindow">TOTP Time Window</Label>
                <Input id="totpWindow" type="number" defaultValue="30" />
                <p className="text-xs text-muted-foreground">
                  How long each TOTP code is valid
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totpDigits">TOTP Digits</Label>
                <Input id="totpDigits" type="number" defaultValue="6" />
                <p className="text-xs text-muted-foreground">
                  Number of digits in TOTP code
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reentryWindow">Re-entry Window</Label>
                <Input id="reentryWindow" type="number" defaultValue="5" />
                <p className="text-xs text-muted-foreground">
                  Time before re-entry is flagged
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="blockUnpaid">Block Unpaid Students</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically reject entries for students with unpaid fees
                </p>
              </div>
              <Switch id="blockUnpaid" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
