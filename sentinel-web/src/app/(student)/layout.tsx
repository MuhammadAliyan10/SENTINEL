import { getUserRole } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import StudentBottomNav from "@/components/features/student/StudentBottomNav";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  if (role !== "STUDENT") {
    redirect("/unauthorized");
  }

  // Check Profile Completion
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isOnOnboarding = false;

  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profileCompleted: true },
    });

    // Get current pathname from next/headers
    const headersList = await headers();
    // Try multiple sources for the pathname
    const pathname =
      headersList.get("x-pathname") ||
      headersList.get("x-invoke-path") ||
      headersList.get("x-url") ||
      "";

    // Check if we're on the onboarding page
    isOnOnboarding = pathname.includes("/onboarding");

    // If profile NOT completed, force to onboarding (unless already there)
    if (!dbUser?.profileCompleted && !isOnOnboarding) {
      redirect("/student/onboarding");
    }

    // If profile IS completed, block access to onboarding
    if (dbUser?.profileCompleted && isOnOnboarding) {
      redirect("/student/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className={isOnOnboarding ? "" : "pb-20"}>{children}</main>
      {!isOnOnboarding && <StudentBottomNav />}
    </div>
  );
}
