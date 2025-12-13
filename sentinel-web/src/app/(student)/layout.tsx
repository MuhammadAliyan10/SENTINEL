import { getStudentAuth } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import StudentBottomNav from "@/components/features/student/StudentBottomNav";
import { headers } from "next/headers";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single optimized auth call
  const auth = await getStudentAuth();

  if (!auth) {
    redirect("/unauthorized");
  }

  // Get current pathname from headers
  const headersList = await headers();
  const pathname =
    headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";

  const isOnOnboarding = pathname.includes("/onboarding");

  // If profile NOT completed, force to onboarding (unless already there)
  if (!auth.profileCompleted && !isOnOnboarding) {
    redirect("/student/onboarding");
  }

  // If profile IS completed, block access to onboarding
  if (auth.profileCompleted && isOnOnboarding) {
    redirect("/student/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pb-20">{children}</main>
      <StudentBottomNav />
    </div>
  );
}
