"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Shield,
  Users,
  Wallet,
  Users2,
  MapPin,
  GraduationCap,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ManagerProfileClientProps {
  user: {
    id: string;
    fullName: string | null;
    sapId: string;
    profilePhotoUrl: string | null;
    role: string;
    section: string | null;
    semester: string | null;
  };
  stats: {
    cashCollected: number;
    totalPasses: number;
  };
  signOut: () => void;
}

export default function ManagerProfileClient({
  user,
  stats,
  signOut,
}: ManagerProfileClientProps) {
  return (
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
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-4 ring-primary/10">
                  <AvatarImage src={user.profilePhotoUrl || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary text-2xl font-bold">
                    {user.fullName?.charAt(0) || "M"}
                  </AvatarFallback>
                </Avatar>

                {/* Status Badge */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-3 border-white flex items-center justify-center shadow-lg bg-emerald-500">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Name & ID */}
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                {user.fullName}
              </h2>
              <p className="text-gray-500 font-mono text-sm mt-1">
                {user.sapId}
              </p>

              {/* Role Badge */}
              <div className="flex gap-2 mt-3">
                <Badge className="px-3 py-1 rounded-full text-xs font-medium border-0 bg-primary/10 text-primary">
                  {user.role}
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
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">
                      Section
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {user.section || "N/A"}
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
                    {user.semester || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Cash Collected */}
          <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-emerald-100 rounded-xl mb-3">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">
                Cash Collected
              </p>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                Rs. {stats.cashCollected.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Passes Issued */}
          <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-primary/10 rounded-xl mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">
                Passes Issued
              </p>
              <p className="text-xl font-bold text-primary mt-1">
                {stats.totalPasses}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-gray-400 pt-4"
        >
          <p>Sentinel Access Control System</p>
          <p>v1.0.0 • Production Build</p>
        </motion.div>
      </div>
    </div>
  );
}
