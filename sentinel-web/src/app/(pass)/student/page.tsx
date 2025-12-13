import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import DigitalPass from "@/components/features/student/DigitalPass";
import { createHmac } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Student Pass Page (Server Component)
 * SECURED: Uses Prisma User table, generates QR server-side
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

  // SECURITY FIX: Use Prisma User table (not legacy profiles)
  const student = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      sapId: true,
      fullName: true,
      profilePhotoUrl: true,
      gender: true,
      section: true,
      role: true,
      isActive: true,
      isPaid: true,
      profileCompleted: true,
      activationToken: true, // Need for QR generation (server-side only, never sent to client)
    },
  });

  if (!student) {
    redirect("/login");
  }

  // Verify user is a student
  if (student.role !== "STUDENT") {
    redirect("/unauthorized");
  }

  // Check account status
  if (!student.isActive) {
    redirect("/unauthorized?reason=revoked");
  }

  // Check payment status
  if (!student.isPaid) {
    redirect("/student/payment-required");
  }

  // Check profile completion
  if (!student.profileCompleted) {
    redirect("/student/onboarding");
  }

  // Generate initial QR payload SERVER-SIDE (token never sent to client)
  const timestamp = Date.now();
  const payloadString = `${student.sapId}:${timestamp}`;
  const signature = createHmac("sha256", student.activationToken || "")
    .update(payloadString)
    .digest("hex");

  const initialQrData = {
    payload: JSON.stringify({
      sap: student.sapId,
      ts: timestamp,
      sig: signature,
    }),
    expiresAt: timestamp + 5 * 60 * 1000, // 5 minutes
  };

  // SECURITY: Only pass safe fields to client (NO activationToken)
  const safeProfile = {
    id: student.id,
    sapId: student.sapId,
    fullName: student.fullName,
    profilePhotoUrl: student.profilePhotoUrl,
    gender: student.gender,
    section: student.section,
  };

  return <DigitalPass user={safeProfile} initialQrData={initialQrData} />;
}
