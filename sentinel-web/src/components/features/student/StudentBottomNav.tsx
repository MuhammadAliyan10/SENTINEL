"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StudentBottomNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/student/dashboard",
      label: "My Pass",
      icon: Ticket,
    },
    {
      href: "/student/profile",
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around z-50">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-0.5",
              isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
