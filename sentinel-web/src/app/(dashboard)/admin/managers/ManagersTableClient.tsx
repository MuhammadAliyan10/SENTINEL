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
import { toggleManagerActive, deleteManager } from "@/actions/managers";
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

  // Column actions
  const actions: ManagerActions = useMemo(
    () => ({
      onView: handleView,
      onToggleActive: handleToggleActive,
      onDelete: handleDelete,
    }),
    [handleView, handleToggleActive, handleDelete]
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
    </>
  );
}
