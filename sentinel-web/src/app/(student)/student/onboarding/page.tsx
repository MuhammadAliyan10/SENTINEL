"use client";

import { useState } from "react";
import { completeProfile } from "@/actions/student-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, User, CreditCard } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(null);

  // Auto-formatting state for CNIC and Phone
  const [cnic, setCnic] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Auto-format CNIC: XXXXX-XXXXXXX-X
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    const digits = e.target.value.replace(/\D/g, "").slice(0, 13);

    // Format with dashes
    let formatted = "";
    if (digits.length > 0) {
      formatted = digits.slice(0, 5);
    }
    if (digits.length > 5) {
      formatted += "-" + digits.slice(5, 12);
    }
    if (digits.length > 12) {
      formatted += "-" + digits.slice(12, 13);
    }

    setCnic(formatted);
  };

  // Auto-format Phone: 0XXX XXXXXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);

    // Format with space after first 4 digits
    let formatted = "";
    if (digits.length > 0) {
      formatted = digits.slice(0, 4);
    }
    if (digits.length > 4) {
      formatted += " " + digits.slice(4, 11);
    }

    setPhoneNumber(formatted);
  };

  async function handleImageUpload(
    file: File,
    bucket: "avatars" | "id-cards"
  ): Promise<string | null> {
    try {
      const options = {
        maxSizeMB: 0.15, // 150KB
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: "image/webp",
      };

      const compressedFile = await imageCompression(file, options);
      const supabase = createClient();

      // SECURITY FIX: Add random UUID to prevent filename collisions
      const randomId = crypto.randomUUID();
      const fileName = `${randomId}-${Date.now()}.webp`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Upload Error:", error);
      toast.error(
        `Failed to upload ${bucket === "avatars" ? "photo" : "card"}`
      );
      return null;
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    // Handle Image Uploads
    const profileFile = (
      form.elements.namedItem("profilePhoto") as HTMLInputElement
    ).files?.[0];
    const cardFile = (
      form.elements.namedItem("universityCard") as HTMLInputElement
    ).files?.[0];

    if (!profileFile || !cardFile) {
      toast.error("Both Profile Photo and ID Card are required");
      setIsLoading(false);
      return;
    }

    // FRONTEND VALIDATION: Check file sizes before upload (3MB limit)
    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB in bytes
    if (profileFile.size > MAX_FILE_SIZE) {
      toast.error(
        `Profile photo is too large (${(profileFile.size / 1024 / 1024).toFixed(
          1
        )}MB). Maximum size is 3MB.`
      );
      setIsLoading(false);
      return;
    }
    if (cardFile.size > MAX_FILE_SIZE) {
      toast.error(
        `University card is too large (${(cardFile.size / 1024 / 1024).toFixed(
          1
        )}MB). Maximum size is 3MB.`
      );
      setIsLoading(false);
      return;
    }

    const profileUrl = await handleImageUpload(profileFile, "avatars");
    const cardUrl = await handleImageUpload(cardFile, "id-cards");

    if (!profileUrl || !cardUrl) {
      setIsLoading(false);
      return;
    }

    formData.append("profilePhotoUrl", profileUrl);
    formData.append("universityCardUrl", cardUrl);

    const res = await completeProfile(formData);
    if (res?.error) {
      toast.error(res.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2 pt-8">
          <h1 className="text-3xl font-bold text-slate-900">Final Step</h1>
          <p className="text-slate-500">
            Complete your profile to activate your Digital Pass.
          </p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Identity Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {/* CNIC */}
              <div className="space-y-2">
                <label className="text-sm font-medium">CNIC Number</label>
                <Input
                  name="cnic"
                  autoComplete="off"
                  placeholder="12345-1234567-1"
                  required
                  value={cnic}
                  onChange={handleCnicChange}
                  inputMode="numeric"
                />
                <p className="text-xs text-muted-foreground">
                  Format: 12345-1234567-1 (Dashes added automatically)
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  name="phoneNumber"
                  placeholder="0300 1234567"
                  autoComplete="off"
                  required
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  inputMode="numeric"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender</label>
                <Select name="gender" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Required for lane routing at the gate.
                </p>
              </div>

              {/* Profile Photo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-300">
                    {profilePreview ? (
                      <Image
                        src={profilePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <Input
                    type="file"
                    name="profilePhoto"
                    accept="image/*"
                    required
                    className="flex-1"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProfilePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Clear face photo. Max 5MB (Auto-compressed).
                </p>
              </div>

              {/* ID Card */}
              <div className="space-y-2">
                <label className="text-sm font-medium">University Card</label>
                <div className="flex flex-col gap-2">
                  <div className="relative w-full h-40 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-300">
                    {cardPreview ? (
                      <Image
                        src={cardPreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <CreditCard className="h-8 w-8 mx-auto mb-2" />
                        <span>Front Side Preview</span>
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    name="universityCard"
                    accept="image/*"
                    required
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCardPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading & Saving...
                  </>
                ) : (
                  "Activate Pass"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
