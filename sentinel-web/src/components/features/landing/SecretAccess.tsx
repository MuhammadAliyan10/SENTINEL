"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SecretAccess() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="active:scale-95">
          <Image
            src="/uolLogo.png"
            alt="University Logo"
            width={160}
            height={90}
            priority
          />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">System Access</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            asChild
            variant="outline"
            className="h-16 justify-start gap-4 px-6"
          >
            <Link href="/manager/login">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold">Staff Portal</span>
                <span className="text-xs text-muted-foreground">
                  Manager Login
                </span>
              </div>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-16 justify-start gap-4 px-6"
          >
            <Link href="/admin/login">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ShieldAlert className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold">Command Center</span>
                <span className="text-xs text-muted-foreground">
                  Admin Access
                </span>
              </div>
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
