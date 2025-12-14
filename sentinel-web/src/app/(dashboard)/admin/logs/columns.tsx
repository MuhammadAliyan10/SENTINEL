"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, Check, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

// ============================================
// TYPES
// ============================================

export interface AuditLogEntry {
  id: string;
  timestamp: Date | string;
  action: string;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  performer: {
    fullName: string | null;
    profilePhotoUrl: string | null;
  };
}

const HIGH_RISK_ACTIONS = [
  "DELETE_MANAGER",
  "REVOKE_ACCESS",
  "MANUAL_PAYMENT",
  "MANUAL_CHECKIN",
  "FREEZE_MANAGER",
  "DELETE",
  "BAN",
  "REVOKE",
];

// ============================================
// COLUMN DEFINITIONS
// ============================================

export const columns: ColumnDef<AuditLogEntry>[] = [
  // Timestamp Column
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => {
      const ts = row.getValue("timestamp") as string | Date;
      const date = typeof ts === "string" ? new Date(ts) : ts;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {date.toLocaleDateString("en-PK", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-xs text-muted-foreground">
            {date.toLocaleTimeString("en-PK", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
      );
    },
  },

  // Performer Column
  {
    accessorKey: "performer",
    header: "Performer",
    cell: ({ row }) => {
      const performer = row.original.performer;
      const ip = row.original.ipAddress;
      return (
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
            {performer.profilePhotoUrl ? (
              <Image
                src={performer.profilePhotoUrl}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs font-medium">
                {performer.fullName?.charAt(0) || "?"}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {performer.fullName || "System"}
            </p>
            {ip && (
              <p className="text-xs text-muted-foreground font-mono">{ip}</p>
            )}
          </div>
        </div>
      );
    },
  },

  // Action Column
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.getValue("action") as string;
      const isRisk = HIGH_RISK_ACTIONS.some((risk) =>
        action.toUpperCase().includes(risk)
      );
      return (
        <Badge
          variant="outline"
          className={
            isRisk
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-slate-50 text-slate-700 border-slate-200"
          }
        >
          {action}
        </Badge>
      );
    },
  },

  // Target Column
  {
    accessorKey: "targetId",
    header: "Target ID",
    cell: ({ row }) => {
      const targetId = row.getValue("targetId") as string | null;
      if (!targetId) return <span className="text-muted-foreground">—</span>;

      return <CopyableText text={targetId} />;
    },
  },

  // Actions Column (View Details)
  {
    id: "actions",
    cell: ({ row }) => {
      const log = row.original;
      return (
        <div className="flex justify-end">
          <Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DialogTrigger asChild>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Details</DialogTitle>
                <DialogDescription>
                  Full details of the audit log entry.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Action:
                    </span>
                    <p>{log.action}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Timestamp:
                    </span>
                    <p>{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground block mb-2">
                    Details JSON:
                  </span>
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto">
                    <pre className="text-xs font-mono">
                      {formatDetails(log.details)}
                    </pre>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];

// Helper components
function CopyableText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1 group">
      <span className="font-mono text-xs text-muted-foreground max-w-[100px] truncate">
        {text}
      </span>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-600" />
        ) : (
          <Copy className="h-3 w-3 text-slate-400" />
        )}
      </button>
    </div>
  );
}

function formatDetails(details: string | null) {
  if (!details) return "null";
  try {
    return JSON.stringify(JSON.parse(details), null, 2);
  } catch {
    return details;
  }
}
