import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ManagerBottomNav } from "@/components/manager/ManagerBottomNav";
import { ManagerTopNav } from "@/components/manager/ManagerTopNav";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: { role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    redirect("/unauthorized");
  }

  if (user.role !== "CR" && user.role !== "GR" && user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Desktop Top Navbar */}
      <div className="hidden md:block">
        <ManagerTopNav />
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <ManagerBottomNav />
      </div>
    </div>
  );
}
