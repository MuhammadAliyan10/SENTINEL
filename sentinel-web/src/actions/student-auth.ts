"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  sapId: z.string().min(1, "SAP ID is required"),
  token: z.string().min(6, "Token must be 6 characters"),
});

export async function loginStudent(formData: FormData) {
  const sapId = formData.get("sapId") as string;
  const token = formData.get("token") as string;

  const validation = loginSchema.safeParse({ sapId, token });

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    // 1. Find User in DB (to check role and profile status)
    const user = await prisma.user.findUnique({
      where: { sapId },
    });

    if (!user) {
      return { error: "Invalid SAP ID or Token" };
    }

    // 2. Verify Token matches (Redundant but safe)
    if (
      !user.activationToken ||
      user.activationToken.toUpperCase() !== token.toUpperCase()
    ) {
      return { error: "Invalid SAP ID or Token" };
    }

    // 3. Sign In with Supabase Auth
    // We use the token as the password because we set it that way in issuePass
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${sapId}@sentinel.edu`,
      password: token.toUpperCase(), // Ensure case matches what we set (usually uppercase)
    });

    if (signInError) {
      console.error("Supabase Login Error:", signInError.message);
      return { error: "Authentication failed. Please check your token." };
    }

    // 4. Redirect based on profile status
    if (!user.profileCompleted) {
      redirect("/student/onboarding");
    } else {
      redirect("/student/dashboard");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Login Error:", error);
    return { error: "Something went wrong" };
  }
}
