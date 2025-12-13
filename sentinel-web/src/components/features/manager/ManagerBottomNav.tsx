"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function ManagerBottomNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/manager/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/manager/summary",
      label: "Summary",
      icon: FileText,
    },
    {
      href: "/manager/profile",
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <div className="bg-white border-t border-slate-200 shadow-lg pb-safe">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <link.icon
                className={cn("h-6 w-6", isActive && "fill-current")}
              />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
