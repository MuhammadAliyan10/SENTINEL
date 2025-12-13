import { getManagerAuth } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import { ManagerBottomNav } from "@/components/features/manager/ManagerBottomNav";
import { ManagerTopNav } from "@/components/features/manager/ManagerTopNav";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single optimized auth call
  const auth = await getManagerAuth();

  if (!auth) {
    redirect("/manager/login");
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
