"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHmac } from "crypto";
import { z } from "zod";

const profileSchema = z.object({
  cnic: z
    .string()
    .regex(/^\d{5}-\d{7}-\d{1}$/, "Invalid CNIC format (e.g. 12345-1234567-1)"),
  phoneNumber: z.string().min(10, "Invalid phone number"),
  gender: z.enum(["MALE", "FEMALE"]),
  profilePhotoUrl: z.string().url("Profile photo is required"),
  universityCardUrl: z.string().url("ID Card photo is required"),
});

export async function completeProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // SECURITY: Check if profile is already completed (Locking)
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { profileCompleted: true },
  });

  if (existingUser?.profileCompleted) {
    return {
      error: "Profile is already completed. Contact admin for changes.",
    };
  }

  const rawData = {
    cnic: formData.get("cnic"),
    phoneNumber: formData.get("phoneNumber"),
    gender: formData.get("gender"),
    profilePhotoUrl: formData.get("profilePhotoUrl"),
    universityCardUrl: formData.get("universityCardUrl"),
  };

  const validation = profileSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const data = validation.data;

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        cnic: data.cnic,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        profilePhotoUrl: data.profilePhotoUrl,
        universityCardUrl: data.universityCardUrl,
        profileCompleted: true,
      },
    });

    revalidatePath("/student/dashboard");
  } catch (error) {
    console.error("Profile Update Error:", error);
    return { error: "Failed to update profile" };
  }

  redirect("/student/dashboard");
}

/**
 * Get ticket data for student dashboard
 * SECURITY FIX: Uses activationToken for QR signing (not service role key)
 * SECURITY FIX: Does NOT return activationToken to client
 */
export async function getTicketData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      fullName: true,
      sapId: true,
      profilePhotoUrl: true,
      universityCardUrl: true,
      gender: true,
      section: true,
      semester: true,
      department: true,
      phoneNumber: true,
      cnic: true,
      activationToken: true, // Needed for QR signing (server-side only)
      profileCompleted: true,
      isActive: true,
      isPaid: true,
      createdAt: true,
      createdBy: {
        select: {
          fullName: true,
          role: true,
        },
      },
    },
  });

  if (!dbUser) redirect("/login");
  if (!dbUser.isActive) redirect("/unauthorized?reason=revoked");
  if (!dbUser.isPaid) redirect("/student/payment-required");
  if (!dbUser.profileCompleted) redirect("/student/onboarding");

  // SECURITY FIX: Generate QR using activationToken (not service role key)
  // QR format is consistent with DigitalPass component
  const timestamp = Date.now();
  const payloadString = `${dbUser.sapId}:${timestamp}`;

  // Use activation token as HMAC secret (consistent with security-actions.ts verification)
  const secret = dbUser.activationToken;
  if (!secret) {
    throw new Error("User has no activation token");
  }

  const signature = createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");

  const qrCode = JSON.stringify({
    sap: dbUser.sapId,
    ts: timestamp,
    sig: signature,
  });

  // SECURITY: Return user data WITHOUT activationToken
  const { activationToken: _, ...safeUser } = dbUser;

  return {
    user: safeUser,
    qrCode,
    timestamp,
  };
}
