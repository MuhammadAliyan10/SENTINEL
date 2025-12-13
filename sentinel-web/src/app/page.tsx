import Link from "next/link";
import { Shield, Users, Ticket, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default async function HomePage() {
  // Check for existing session and redirect if found
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (supabaseUser) {
    const user = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      select: { role: true },
    });

    if (user) {
      switch (user.role) {
        case "SUPER_ADMIN":
          redirect("/admin");
        case "CR":
        case "GR":
          redirect("/manager/dashboard");
        case "STUDENT":
          redirect("/student");
      }
    }
  }

  return (
    <AuthLayout wrapperClassName="max-w-5xl">
      <div className="flex flex-col items-center space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              SENTINEL
            </h1>
            <p className="text-slate-500 font-medium">
              University Access Control System
            </p>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid gap-6 md:grid-cols-3 w-full">
          {/* Student Portal */}
          <Card className="bg-white/95 backdrop-blur-sm border-slate-200 hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Ticket className="w-7 h-7 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Student Portal
              </CardTitle>
              <CardDescription>Access your digital pass</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
              >
                <Link href="/login">Open Digital Pass</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Staff Portal */}
          <Card className="bg-white/95 backdrop-blur-sm border-slate-200 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-emerald-600" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Staff Portal
              </CardTitle>
              <CardDescription>Manage student registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
              >
                <Link href="/manager/login">Manager Login</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Admin Portal */}
          <Card className="bg-white/95 backdrop-blur-sm border-slate-200 hover:border-red-500/50 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <ShieldAlert className="w-7 h-7 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Command Center
              </CardTitle>
              <CardDescription>System administration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                className="w-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
              >
                <Link href="/admin/login">Admin Access</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}
