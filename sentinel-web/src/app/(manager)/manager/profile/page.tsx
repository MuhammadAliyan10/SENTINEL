import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getManagerStats } from "@/actions/manager-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  User as UserIcon,
  Shield,
  MapPin,
  Wallet,
  Users,
} from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/login");

  const [user, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: supabaseUser.id },
    }),
    getManagerStats(),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      {/* Profile Card */}
      <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
        <CardContent className="pt-8 text-center space-y-4">
          <div className="relative mx-auto w-24 h-24">
            <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
              <AvatarImage src={user.profilePhotoUrl || ""} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {user.fullName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {user.fullName}
            </h2>
            <p className="text-sm text-slate-500 font-mono">{user.sapId}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left pt-4 border-t border-slate-100">
            <div className="space-y-1 p-3 bg-white rounded-lg border border-slate-100">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3 text-primary" /> Role
              </p>
              <p className="font-medium text-sm">{user.role}</p>
            </div>
            <div className="space-y-1 p-3 bg-white rounded-lg border border-slate-100">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" /> Section
              </p>
              <p className="font-medium text-sm">{user.section || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cash Collected</p>
              <p className="text-lg font-bold text-primary">
                Rs. {stats.cashCollected.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Passes Issued</p>
              <p className="text-lg font-bold text-primary">
                {stats.totalPasses}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <form
        action={async () => {
          "use server";
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect("/login");
        }}
      >
        <Button
          variant="destructive"
          className="w-full h-12 text-base shadow-sm"
          type="submit"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </form>

      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>Sentinel Access Control System</p>
        <p>v1.0.0 • Production Build</p>
      </div>
    </div>
  );
}
