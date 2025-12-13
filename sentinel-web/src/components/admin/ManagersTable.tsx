"use client";

import { useState, useTransition } from "react";
import {
  type ManagerWithStats,
  toggleManagerActive,
  deleteManager,
} from "@/actions/managers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, User } from "lucide-react";
import { toast } from "sonner";

interface ManagersTableProps {
  managers: ManagerWithStats[];
}

export function ManagersTable({ managers }: ManagersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [managerToDelete, setManagerToDelete] =
    useState<ManagerWithStats | null>(null);

  const handleToggleActive = (manager: ManagerWithStats) => {
    startTransition(async () => {
      const result = await toggleManagerActive(manager.id, !manager.isActive);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = (manager: ManagerWithStats) => {
    setManagerToDelete(manager);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!managerToDelete) return;

    startTransition(async () => {
      const result = await deleteManager(managerToDelete.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setDeleteDialogOpen(false);
      setManagerToDelete(null);
    });
  };

  if (managers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No managers yet</p>
        <p className="text-sm">Create a CR or GR to get started</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Students</TableHead>
            <TableHead className="text-right">Cash Liability</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {managers.map((manager) => (
            <TableRow
              key={manager.id}
              className={!manager.isActive ? "opacity-50" : ""}
            >
              <TableCell className="font-medium">
                {manager.fullName || "—"}
                <span className="block text-xs text-muted-foreground font-mono">
                  {manager.sapId}
                </span>
              </TableCell>
              <TableCell>{manager.section || "—"}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    manager.role === "CR"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-pink-50 text-pink-700 border-pink-200"
                  }
                >
                  {manager.role}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {manager._count.createdUsers}
              </TableCell>
              <TableCell className="text-right font-mono font-medium">
                Rs. {manager.cashLiability.toLocaleString()}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Switch
                    checked={manager.isActive}
                    onCheckedChange={() => handleToggleActive(manager)}
                    disabled={isPending}
                  />
                  <span className="text-xs text-muted-foreground">
                    {manager.isActive ? "Active" : "Frozen"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(manager)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Manager</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {managerToDelete?.fullName || managerToDelete?.sapId}
              </strong>
              ? This action cannot be undone.
              {managerToDelete && managerToDelete._count.createdUsers > 0 && (
                <span className="block mt-2 text-amber-600">
                  Warning: This manager has{" "}
                  {managerToDelete._count.createdUsers} registered students.
                  Deletion may fail.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
