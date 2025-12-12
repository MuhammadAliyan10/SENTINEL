import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPassClient } from "./StudentPassClient";

export const dynamic = "force-dynamic";

/**
 * Student Pass Page (Server Component)
 * SECURED: Fetches real user data server-side
 */
export default async function StudentPassPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/student");
  }

  // Get user profile (excluding totp_secret for security)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, sap_id, role, payment_status, photo_url")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  // Pass profile to client component
  return <StudentPassClient profile={profile} />;
}
