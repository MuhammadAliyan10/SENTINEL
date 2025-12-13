"use server";

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadStudentImage(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "No file provided" };
  }

  // 1. Strict Server-Side Validation
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File size exceeds 2MB limit" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Invalid file type. Only JPG, PNG, and WebP are allowed." };
  }

  try {
    // 2. Upload using Service Role (Bypassing RLS for write)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileExt = file.name.split(".").pop();
    const fileName = `${randomUUID()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;

    // 3. Return Public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("avatars").getPublicUrl(fileName);

    return { url: publicUrl };
  } catch (error) {
    console.error("Upload Error:", error);
    return { error: "Failed to upload image" };
  }
}
