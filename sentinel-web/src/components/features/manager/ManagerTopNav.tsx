"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function ManagerTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/manager/login");
  };

  const navItems = [
    { href: "/manager/dashboard", label: "Issue Pass" },
    { href: "/manager/summary", label: "Summary" },
    { href: "/manager/profile", label: "Profile" },
  ];

  return (
    <header className="bg-white border-b border-border h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Image
            src="/Logo.png"
            alt="UOL Logo"
            width={32}
            height={32}
            className="h-20 w-20 object-contain"
          />
        </div>
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </header>
  );
}
