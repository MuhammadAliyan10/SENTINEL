import { getTicketData } from "@/actions/student-actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/features/student/ProfileClient";

export default async function StudentProfilePage() {
  const data = await getTicketData();
  const { user } = data;

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <ProfileClient
      user={{
        id: user.id,
        fullName: user.fullName,
        sapId: user.sapId,
        profilePhotoUrl: user.profilePhotoUrl,
        universityCardUrl: user.universityCardUrl || null,
        gender: user.gender,
        section: user.section,
        semester: user.semester,
        phoneNumber: user.phoneNumber,
        cnic: user.cnic,
        isActive: user.isActive,
        isPaid: user.isPaid,
        createdBy: user.createdBy,
      }}
      signOut={signOut}
    />
  );
}
