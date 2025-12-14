import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile } from "@/actions/students-actions";
import { StudentProfile } from "@/components/features/admin/students/StudentProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }
}

export default async function StudentProfilePage({ params }: PageProps) {
  await verifyAdmin();
  const { id } = await params;

  const student = await getStudentProfile(id);

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <StudentProfile student={student} />
    </div>
  );
}
