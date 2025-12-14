"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Shield } from "lucide-react";
import { GuardListItem } from "@/actions/guard-actions";

// ============================================
// TYPES
// ============================================

export interface GuardActions {
  onToggleActive: (guard: GuardListItem) => void;
  onDelete: (guard: GuardListItem) => void;
}

// ============================================
// COLUMN DEFINITIONS
// ============================================

export function getGuardColumns(
  actions: GuardActions
): ColumnDef<GuardListItem>[] {
  return [
    // Selection Column
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // Name Column
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => {
        const fullName = row.getValue("fullName") as string | null;
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-full">
              <Shield className="h-3 w-3 text-primary" />
            </div>
            <span className="font-medium">{fullName || "Unnamed"}</span>
          </div>
        );
      },
    },

    // Email Column
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return (
          <div className="font-mono text-xs text-muted-foreground">{email}</div>
        );
      },
    },

    // Created Date Column
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return (
          <div className="text-muted-foreground">
            {new Date(date).toLocaleDateString("en-PK", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        );
      },
    },

    // Status Column (Switch)
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const guard = row.original;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={guard.isActive}
              onCheckedChange={() => actions.onToggleActive(guard)}
            />
            <span className="text-xs text-muted-foreground">
              {guard.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        );
      },
    },

    // Actions Column
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const guard = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => actions.onDelete(guard)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
