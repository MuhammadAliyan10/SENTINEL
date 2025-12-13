"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const profileSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
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

  const rawData = {
    fullName: formData.get("fullName"),
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
        fullName: data.fullName,
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

import { revalidatePath } from "next/cache";
import { createHmac } from "crypto";

// ... existing imports

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
      activationToken: true,
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
  if (!dbUser.profileCompleted) redirect("/student/onboarding");

  // Generate QR Payload
  const timestamp = Date.now();
  const payload = `${user.id}:${timestamp}`;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  const qrCode = `${payload}:${signature}`;

  return {
    user: dbUser,
    qrCode,
    timestamp,
  };
}
