import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin Layout - "Fortress" Security Layer
 *
 * This layout enforces SUPER_ADMIN role verification using Prisma.
 * Middleware only checks session existence (Edge-safe).
 * All role-based access control happens here on the server.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ============================================
  // STEP 1: Get Supabase Session
  // ============================================
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  // This should not happen if middleware is working, but double-check
  if (!supabaseUser) {
    redirect("/login");
  }

  // ============================================
  // STEP 2: Verify SUPER_ADMIN Role via Prisma
  // ============================================
  const user = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: {
      id: true,
      sapId: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  // User not found in Prisma DB or account disabled
  if (!user || !user.isActive) {
    redirect("/unauthorized");
  }

  // Role check - only SUPER_ADMIN can access admin panel
  if (user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-white px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <AdminHeader />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 bg-slate-50">{children}</main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
