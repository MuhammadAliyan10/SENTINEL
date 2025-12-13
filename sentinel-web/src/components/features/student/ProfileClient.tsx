"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  LogOut,
  Phone,
  CreditCard,
  MapPin,
  Lock,
  HelpCircle,
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
  IdCard,
  X,
  ZoomIn,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProfileClientProps {
  user: {
    id: string;
    fullName: string | null;
    sapId: string;
    profilePhotoUrl: string | null;
    universityCardUrl: string | null;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    section: string | null;
    semester: string | null;
    phoneNumber: string | null;
    cnic: string | null;
    isActive: boolean;
    isPaid: boolean;
    createdBy: {
      fullName: string | null;
      role: string;
    } | null;
  };
  signOut: () => void;
}

export default function ProfileClient({ user, signOut }: ProfileClientProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isMale = user.gender === "MALE";
  const isActive = user.isActive;
  const isPaid = user.isPaid;

  // Get section/semester from manager info if not set on user
  const displaySection =
    user.section || (user.createdBy ? "See Manager" : "N/A");
  const displaySemester =
    user.semester || (user.createdBy ? "See Manager" : "N/A");

  return (
    <>
      {/* Image Lightbox/Gallery */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-black/95">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          {selectedImage && (
            <div className="relative w-full h-[90vh] flex items-center justify-center p-4">
              <Image
                src={selectedImage}
                alt="Full size preview"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-slate-50 p-4 pb-24">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <h1 className="text-2xl font-bold text-slate-900 pt-4">My Profile</h1>

          {/* Profile Card */}
          <Card className="bg-white rounded-sm p-0 border-slate-200 shadow-sm overflow-hidden">
            {/* Header with Photo */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 flex flex-col items-center">
              <div className="relative">
                <button
                  onClick={() =>
                    user.profilePhotoUrl &&
                    setSelectedImage(user.profilePhotoUrl)
                  }
                  className="relative group"
                  disabled={!user.profilePhotoUrl}
                >
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg cursor-pointer">
                    <AvatarImage src={user.profilePhotoUrl || ""} />
                    <AvatarFallback className="bg-slate-200 text-slate-600 text-xl font-bold">
                      {user.fullName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {user.profilePhotoUrl && (
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white" />
                    </div>
                  )}
                </button>
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center",
                    isActive ? "bg-emerald-500" : "bg-red-500"
                  )}
                >
                  {isActive ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-white" />
                  )}
                </div>
              </div>
              <h2 className="mt-3 text-lg font-bold text-white">
                {user.fullName}
              </h2>
              <p className="text-slate-400 font-mono text-sm">{user.sapId}</p>
              <div className="flex gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-0 text-white text-xs",
                    isMale ? "bg-blue-500" : "bg-pink-500"
                  )}
                >
                  {isMale ? "MALE" : "FEMALE"}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "border-0 text-white text-xs",
                    isPaid ? "bg-emerald-500" : "bg-amber-500"
                  )}
                >
                  {isPaid ? "PAID" : "PENDING"}
                </Badge>
              </div>
            </div>

            {/* Details */}
            <CardContent className="p-4 space-y-3">
              {/* Class Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">
                      Section
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {displaySection}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">
                      Semester
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {displaySemester}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <Phone className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">
                      Phone
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {user.phoneNumber || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <CreditCard className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">CNIC</p>
                    <p className="text-sm font-medium text-slate-900">
                      {user.cnic
                        ? `${user.cnic.slice(0, 5)}-*******-${user.cnic.slice(
                            -1
                          )}`
                        : "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Registration Info */}
              {user.createdBy && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-lg">
                      <Shield className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">
                        Registered By
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {user.createdBy.fullName || "Admin"} (
                        {user.createdBy.role})
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* University Card Preview */}
          {user.universityCardUrl && (
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-slate-600" />
                  University Card
                  <span className="ml-auto text-xs text-slate-400">
                    Tap to zoom
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <button
                  onClick={() => setSelectedImage(user.universityCardUrl)}
                  className="relative w-full aspect-[1.6/1] rounded-lg overflow-hidden border border-slate-200 group cursor-pointer"
                >
                  <Image
                    src={user.universityCardUrl}
                    alt="University Card"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white" />
                  </div>
                </button>
              </CardContent>
            </Card>
          )}

          {/* Locked Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700">
                Profile Locked
              </p>
              <p className="text-xs text-amber-600/80">
                Contact Admin for corrections.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              asChild
              variant="outline"
              className="w-full bg-white border-slate-200 text-slate-700"
            >
              <Link href="https://wa.me/923026767428" target="_blank">
                <HelpCircle className="mr-2 h-4 w-4" />
                Need Help?
              </Link>
            </Button>

            <form action={signOut}>
              <Button
                variant="ghost"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
