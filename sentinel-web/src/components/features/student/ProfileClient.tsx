"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  LogOut,
  Phone,
  CreditCard,
  Lock,
  HelpCircle,
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
  IdCard,
  X,
  ZoomIn,
  Users,
  Sparkles,
  GraduationCap,
  Users2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

  const displaySection =
    user.section || (user.createdBy ? "See Manager" : "N/A");
  const displaySemester =
    user.semester || (user.createdBy ? "See Manager" : "N/A");

  return (
    <>
      {/* Image Lightbox */}
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

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-28">
        {/* Premium Header with Gradient */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary/80 pt-12 pb-20 px-4 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 text-center"
          >
            <h1 className="text-white text-2xl font-bold flex items-center justify-center gap-2">
              <Users2 className="h-5 w-5" />
              My Profile
            </h1>
          </motion.div>
        </div>

        <div className="max-w-md mx-auto px-4 -mt-14 space-y-4">
          {/* Profile Card - Premium Design */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
              {/* Avatar Section */}
              <div className="flex flex-col items-center pt-6 pb-4 px-6">
                <div className="relative">
                  <button
                    onClick={() =>
                      user.profilePhotoUrl &&
                      setSelectedImage(user.profilePhotoUrl)
                    }
                    className="relative group"
                    disabled={!user.profilePhotoUrl}
                  >
                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-4 ring-primary/10">
                      <AvatarImage src={user.profilePhotoUrl || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary text-2xl font-bold">
                        {user.fullName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {user.profilePhotoUrl && (
                      <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </button>

                  {/* Status Badge */}
                  <div
                    className={cn(
                      "absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-3 border-white flex items-center justify-center shadow-lg",
                      isActive ? "bg-emerald-500" : "bg-red-500"
                    )}
                  >
                    {isActive ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <XCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>

                {/* Name & ID */}
                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  {user.fullName}
                </h2>
                <p className="text-gray-500 font-mono text-sm mt-1">
                  {user.sapId}
                </p>

                {/* Badges */}
                <div className="flex gap-2 mt-3">
                  <Badge
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border-0",
                      isMale
                        ? "bg-blue-100 text-blue-700"
                        : "bg-pink-100 text-pink-700"
                    )}
                  >
                    {isMale ? "Male" : "Female"}
                  </Badge>
                  <Badge
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border-0",
                      isPaid
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {isPaid ? "✓ Paid" : "Pending"}
                  </Badge>
                </div>
              </div>

              {/* Info Grid */}
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-3">
                  {/* Section */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">
                        Section
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {displaySection}
                    </p>
                  </div>

                  {/* Semester */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">
                        Semester
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {displaySemester}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">
                        Phone
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.phoneNumber || "Not set"}
                    </p>
                  </div>

                  {/* CNIC */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">
                        CNIC
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 font-mono">
                      {user.cnic
                        ? `${user.cnic.slice(0, 5)}-***-${user.cnic.slice(-1)}`
                        : "Not set"}
                    </p>
                  </div>
                </div>

                {/* Registered By */}
                {user.createdBy && (
                  <div className="mt-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">
                        Registered By
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.createdBy.fullName || "Admin"}{" "}
                        <span className="text-gray-500 font-normal">
                          ({user.createdBy.role})
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* University Card */}
          {user.universityCardUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="px-5 py-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-800">
                    <IdCard className="h-4 w-4 text-primary" />
                    University Card
                    <span className="ml-auto text-xs text-gray-400 font-normal">
                      Tap to zoom
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-2">
                  <button
                    onClick={() => setSelectedImage(user.universityCardUrl)}
                    className="relative w-full aspect-[1.6/1] rounded-xl overflow-hidden border border-gray-100 group cursor-pointer shadow-sm"
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
            </motion.div>
          )}

          {/* Locked Notice - Premium Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
          >
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Profile Locked
              </p>
              <p className="text-xs text-amber-700/80 mt-0.5">
                Contact Admin if you need any corrections.
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 pt-2"
          >
            <Button
              asChild
              variant="outline"
              className="w-full h-12 bg-white border-gray-200 text-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <Link href="https://wa.me/923026767428" target="_blank">
                <HelpCircle className="mr-2 h-4 w-4" />
                Need Help? Contact Support
              </Link>
            </Button>

            <form action={signOut}>
              <Button
                variant="ghost"
                className="w-full h-12 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}
