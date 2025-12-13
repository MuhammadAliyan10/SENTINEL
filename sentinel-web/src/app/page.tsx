import Link from "next/link";
import { Shield, Users, Smartphone } from "lucide-react";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-accent-foreground rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20 mb-6">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Sentinel
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          University Access Control System
        </p>
      </div>

      {/* Portal Selection */}
      <div className="grid gap-4 md:grid-cols-2 max-w-2xl w-full">
        <Card className="bg-white border-border hover:border-primary/50 hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-foreground">Student Portal</CardTitle>
            <CardDescription>
              Access your digital pass with dynamic QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link href="/student">Open Student Pass</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-border hover:border-amber-500/50 hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <CardTitle className="text-foreground">Admin Dashboard</CardTitle>
            <CardDescription>
              Manage students, view logs, and generate passes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              className="w-full border-border text-secondary-foreground hover:bg-secondary"
            >
              <Link href="/admin">Open Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Login Link */}
      <div className="mt-8">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Sign in to your account →
        </Link>
      </div>
    </div>
  );
}
