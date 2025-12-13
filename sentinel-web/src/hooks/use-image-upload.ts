"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";

interface UseImageUploadResult {
  uploadImage: (
    file: File,
    bucket: "avatars" | "id-cards"
  ) => Promise<string | null>;
  isUploading: boolean;
}

export function useImageUpload(): UseImageUploadResult {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (
    file: File,
    bucket: "avatars" | "id-cards"
  ): Promise<string | null> => {
    setIsUploading(true);
    try {
      // 1. Compress Image
      const options = {
        maxSizeMB: 0.2, // 200KB
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: "image/webp",
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Upload to Supabase
      const supabase = createClient();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.webp`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile);

      if (uploadError) {
        throw uploadError;
      }

      // 3. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Upload Hook Error:", error);
      toast.error("Failed to upload image. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
}
