"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Snowflake, Flame, Trash2 } from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface ManagerRow {
  id: string;
  sapId: string;
  fullName: string | null;
  role: "CR" | "GR";
  section: string | null;
  semester: string | null;
  isActive: boolean;
  createdAt: Date;
  studentsCount: number;
  cashLiability: number;
}

export interface ManagerActions {
  onView: (manager: ManagerRow) => void;
  onToggleActive: (manager: ManagerRow) => void;
  onDelete: (manager: ManagerRow) => void;
}

// ============================================
// COLUMN DEFINITIONS
// ============================================

export function getManagerColumns(
  actions: ManagerActions
): ColumnDef<ManagerRow>[] {
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
        const sapId = row.original.sapId;
        return (
          <div>
            <span className="font-medium">{fullName || "Unnamed"}</span>
            <span className="block text-xs text-muted-foreground font-mono">
              {sapId}
            </span>
          </div>
        );
      },
    },

    // Class Column
    {
      accessorKey: "section",
      header: "Class",
      cell: ({ row }) => {
        const section = row.getValue("section") as string | null;
        const semester = row.original.semester;

        if (!semester && !section)
          return <span className="text-muted-foreground">—</span>;

        return (
          <Badge variant="secondary" className="font-mono text-xs">
            Sem {semester || "?"} - Sec {section || "?"}
          </Badge>
        );
      },
    },

    // Role Column
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as "CR" | "GR";
        return (
          <Badge
            variant="outline"
            className={
              role === "CR"
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-pink-50 text-pink-700 border-pink-200"
            }
          >
            {role}
          </Badge>
        );
      },
    },

    // Students Count Column
    {
      accessorKey: "studentsCount",
      header: () => <div className="text-right">Students</div>,
      cell: ({ row }) => {
        const count = row.getValue("studentsCount") as number;
        return <div className="text-right font-mono">{count}</div>;
      },
    },

    // Cash Liability Column
    {
      accessorKey: "cashLiability",
      header: () => <div className="text-right">Cash Liability</div>,
      cell: ({ row }) => {
        const amount = row.getValue("cashLiability") as number;
        return (
          <div className="text-right font-mono font-medium">
            Rs. {amount.toLocaleString()}
          </div>
        );
      },
    },

    // Status Column
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return isActive ? (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Active
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            Frozen
          </Badge>
        );
      },
    },

    // Actions Column
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const manager = row.original;
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
                <DropdownMenuItem onClick={() => actions.onView(manager)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => actions.onToggleActive(manager)}
                >
                  {manager.isActive ? (
                    <>
                      <Snowflake className="mr-2 h-4 w-4" />
                      Freeze Account
                    </>
                  ) : (
                    <>
                      <Flame className="mr-2 h-4 w-4" />
                      Unfreeze Account
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => actions.onDelete(manager)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
