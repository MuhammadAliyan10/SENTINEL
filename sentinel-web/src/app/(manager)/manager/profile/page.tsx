import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getManagerStats } from "@/actions/manager-actions";
import ManagerProfileClient from "@/components/features/manager/ManagerProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/login");

  const [user, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: supabaseUser.id },
      select: {
        id: true,
        fullName: true,
        sapId: true,
        profilePhotoUrl: true,
        role: true,
        section: true,
        semester: true,
      },
    }),
    getManagerStats(),
  ]);

  if (!user) redirect("/login");

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <ManagerProfileClient
      user={{
        id: user.id,
        fullName: user.fullName,
        sapId: user.sapId,
        profilePhotoUrl: user.profilePhotoUrl,
        role: user.role,
        section: user.section,
        semester: user.semester,
      }}
      stats={{
        cashCollected: stats.cashCollected,
        totalPasses: stats.totalPasses,
      }}
      signOut={signOut}
    />
  );
}
