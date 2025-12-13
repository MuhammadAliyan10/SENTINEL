import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/features/admin/AdminSidebar";
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
    redirect("/admin/login");
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
    redirect("/admin/login");
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset>
        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 bg-slate-50 relative">
          <div className="absolute top-4 left-4 z-50 md:hidden">
            <SidebarTrigger />
          </div>
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
