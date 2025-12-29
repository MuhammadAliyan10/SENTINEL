"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaginationState, RowSelectionState } from "@tanstack/react-table";
import { DataTable, DataTableToolbar } from "@/components/ui/data-table";
import {
  getManagerColumns,
  type ManagerRow,
  type ManagerActions,
} from "./columns";
import {
  toggleManagerActive,
  deleteManager,
  hardDeleteManager,
} from "@/actions/managers-actions";
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
import { toast } from "sonner";

interface ManagersTableClientProps {
  initialData: ManagerRow[];
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

export function ManagersTableClient({
  initialData,
  pageCount,
  currentPage,
  pageSize,
}: ManagersTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Pagination state synced with URL
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: currentPage - 1,
    pageSize,
  });

  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<ManagerRow | null>(
    null
  );

  // NEW: Hard Delete dialog state
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [managerToHardDelete, setManagerToHardDelete] =
    useState<ManagerRow | null>(null);
  const [auditLogCount, setAuditLogCount] = useState(0);

  // Handle pagination changes - update URL
  const handlePaginationChange = useCallback(
    (
      updater: PaginationState | ((old: PaginationState) => PaginationState)
    ) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater;
      setPagination(newPagination);

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(newPagination.pageIndex + 1));
        params.set("limit", String(newPagination.pageSize));
        router.push(`?${params.toString()}`);
      });
    },
    [pagination, router, searchParams]
  );

  // Action handlers
  const handleView = useCallback(
    (manager: ManagerRow) => {
      router.push(`/admin/managers/${manager.id}`);
    },
    [router]
  );

  const handleToggleActive = useCallback(
    (manager: ManagerRow) => {
      startTransition(async () => {
        const result = await toggleManagerActive(manager.id, !manager.isActive);
        if (result.success) {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      });
    },
    [router]
  );

  const handleDelete = useCallback((manager: ManagerRow) => {
    setManagerToDelete(manager);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!managerToDelete) return;

    startTransition(async () => {
      const result = await deleteManager(managerToDelete.id);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
      setDeleteDialogOpen(false);
      setManagerToDelete(null);
    });
  }, [managerToDelete, router]);

  // NEW: Hard Delete handler with cascade
  const handleHardDelete = useCallback((manager: ManagerRow) => {
    setManagerToHardDelete(manager);
    // For now, we'll set a placeholder count (the actual count will be fetched in the action)
    // In a real scenario, you might fetch this beforehand for better UX
    setAuditLogCount(0); // Will be updated by the server response if needed
    setHardDeleteDialogOpen(true);
  }, []);

  const confirmHardDelete = useCallback(() => {
    if (!managerToHardDelete) return;

    startTransition(async () => {
      const result = await hardDeleteManager(managerToHardDelete.id);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
      setHardDeleteDialogOpen(false);
      setManagerToHardDelete(null);
    });
  }, [managerToHardDelete, router]);

  // Column actions
  const actions: ManagerActions = useMemo(
    () => ({
      onView: handleView,
      onToggleActive: handleToggleActive,
      onDelete: handleDelete,
      onHardDelete: handleHardDelete, // NEW: Hard delete action
    }),
    [handleView, handleToggleActive, handleDelete, handleHardDelete]
  );

  // Get columns with actions
  const columns = useMemo(() => getManagerColumns(actions), [actions]);

  return (
    <>
      <DataTable
        columns={columns}
        data={initialData}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      >
        <DataTableToolbar searchPlaceholder="Search managers..." />
      </DataTable>

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
              {managerToDelete && managerToDelete.studentsCount > 0 && (
                <span className="block mt-2 text-amber-600">
                  Warning: This manager has {managerToDelete.studentsCount}{" "}
                  registered students. Deletion may fail.
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

      {/* NEW: Hard Delete Confirmation Dialog */}
      <AlertDialog
        open={hardDeleteDialogOpen}
        onOpenChange={setHardDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> Hard Delete Manager
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                This action is PERMANENT and cannot be undone.
              </p>
              <p>
                You are about to delete{" "}
                <strong className="text-foreground">
                  {managerToHardDelete?.fullName || managerToHardDelete?.sapId}
                </strong>
                .
              </p>

              {/* Show different message based on whether they have generated passes */}
              {managerToHardDelete && managerToHardDelete.studentsCount > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-700 font-semibold">✖ Cannot Delete</p>
                  <p className="text-red-600 text-sm mt-1">
                    This manager has {managerToHardDelete.studentsCount}{" "}
                    generated passes. Deletion is blocked to preserve ticket
                    validity and financial audit trails.
                  </p>
                  <p className="text-red-600 text-sm mt-2">
                    Please use the "Freeze" option instead.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-amber-800 font-semibold">
                    This will also delete:
                  </p>
                  <ul className="text-amber-700 text-sm mt-1 space-y-1">
                    <li>
                      • All audit logs where this manager is the performer
                    </li>
                    <li>• The manager's account from the system</li>
                    <li>• The manager's authentication credentials</li>
                  </ul>
                  <p className="text-amber-800 font-semibold mt-3">
                    Are you absolutely sure?
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmHardDelete}
              disabled={
                isPending || (managerToHardDelete?.studentsCount ?? 0) > 0
              }
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {isPending ? "Deleting..." : "Yes, Hard Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
