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
import Image from "next/image";

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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/UniversityLogo.jpeg"
              alt="University Logo"
              width={180}
              height={100}
              priority
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              SENTINEL
            </h1>
            <p className="text-muted-foreground font-medium">
              University Access Control System
            </p>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid gap-6 md:grid-cols-3 w-full">
          {/* Student Portal */}
          <Card className="border-2 border-muted hover:border-primary/50 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Ticket className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">
                Student Portal
              </CardTitle>
              <CardDescription>Access your digital pass</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/login">Open Digital Pass</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Staff Portal */}
          <Card className="border-2 border-muted hover:border-primary/50 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">Staff Portal</CardTitle>
              <CardDescription>Manage student registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/manager/login">Manager Login</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Admin Portal */}
          <Card className="border-2 border-muted hover:border-primary/50 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <ShieldAlert className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">
                Command Center
              </CardTitle>
              <CardDescription>System administration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/admin/login">Admin Access</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
