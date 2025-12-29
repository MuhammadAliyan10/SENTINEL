"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ChevronUp,
  UserCog,
  FileText,
  Shield,
  ScrollText,
  ShieldCheck,
  GraduationCap,
  Settings2,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  sapId: string;
  fullName: string | null;
  role: string;
}

interface AdminSidebarProps {
  user: AdminUser;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Guards",
    href: "/admin/guards",
    icon: Shield,
  },
  {
    title: "Managers",
    href: "/admin/managers",
    icon: UserCog,
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: Users,
  },
  {
    title: "System Logs",
    href: "/admin/logs",
    icon: ScrollText,
  },
  {
    title: "Audit Ledger",
    href: "/admin/audit",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  const getInitials = (name: string | null): string => {
    if (!name) return "AD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      {/* Header with Logo */}
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/50 px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent"
            >
              <div className="flex aspect-square size-10 items-center justify-center rounded-xl">
                <img
                  src="/Logo.png"
                  alt="Sentinel"
                  className="size-8 object-contain"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-lg tracking-tight text-foreground">
                  Sentinel
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-4 gap-4">
        {/* Group 1: Overview */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-2 mb-2 group-data-[collapsible=icon]:hidden">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/admin"}
                  tooltip="Dashboard"
                >
                  <Link
                    href="/admin"
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <LayoutDashboard className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Dashboard
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/live")}
                  tooltip="Live Monitor"
                >
                  <Link
                    href="/admin/live"
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <Activity className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Live Monitor
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group 2: Management */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-2 mb-2 group-data-[collapsible=icon]:hidden">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/guards")}
                  tooltip="Guards"
                >
                  <Link
                    href="/admin/guards"
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <ShieldCheck className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Guards
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/managers")}
                  tooltip="Managers"
                >
                  <Link
                    href="/admin/managers"
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <UserCog className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Managers
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/students")}
                  tooltip="Students"
                >
                  <Link
                    href="/admin/students"
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <GraduationCap className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Students
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group 3: System */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-2 mb-2 group-data-[collapsible=icon]:hidden">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/logs")}
                  tooltip="System Logs"
                >
                  <Link
                    href="/admin/logs"
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <ScrollText className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      System Logs
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/audit")}
                  tooltip="Audit Ledger"
                >
                  <Link
                    href="/admin/audit"
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <FileText className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Audit Ledger
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/settings")}
                  tooltip="Settings"
                >
                  <Link
                    href="/admin/settings"
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <Settings2 className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Settings
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Menu */}
      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
                >
                  <Avatar className="h-9 w-9 rounded-lg border border-border">
                    <AvatarImage src="/avatars/admin.png" alt="Admin" />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-foreground">
                      {user.fullName || "Super Admin"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.role}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-border shadow-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="cursor-pointer">
                  <Settings2 className="mr-2 size-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer bg-destructive/5 focus:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
