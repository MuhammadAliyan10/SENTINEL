"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  createGuard,
  deleteGuard,
  toggleGuardStatus,
  type GuardListItem,
} from "@/actions/guard-actions";
import { DataTable } from "@/components/ui/data-table";
import {
  getGuardColumns,
  type GuardActions,
} from "@/app/(dashboard)/admin/guards/columns";
import {
  PaginationState,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface GuardsClientProps {
  initialGuards: GuardListItem[];
}

export default function GuardsClient({ initialGuards }: GuardsClientProps) {
  const [guards, setGuards] = useState<GuardListItem[]>(initialGuards);
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [guardToDelete, setGuardToDelete] = useState<GuardListItem | null>(
    null
  );

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Table State (Client-side pagination for Guards as list is small)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState("");

  const handleCreateGuard = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    startTransition(async () => {
      const result = await createGuard(fullName, email, password);

      if (result.success && result.guardId) {
        toast.success(result.message);
        // Add new guard to state
        setGuards([
          {
            id: result.guardId,
            fullName: fullName,
            email: email.toLowerCase(),
            createdAt: new Date().toISOString(),
            isActive: true,
          },
          ...guards,
        ]);
        setCreateDialogOpen(false);
        setFullName("");
        setEmail("");
        setPassword("");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleToggleStatus = useCallback((guard: GuardListItem) => {
    startTransition(async () => {
      // Optimistic update
      setGuards((prev) =>
        prev.map((g) =>
          g.id === guard.id ? { ...g, isActive: !g.isActive } : g
        )
      );

      const result = await toggleGuardStatus(guard.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        // Revert on error
        setGuards((prev) =>
          prev.map((g) =>
            g.id === guard.id ? { ...g, isActive: guard.isActive } : g
          )
        );
      }
    });
  }, []);

  const handleDelete = useCallback((guard: GuardListItem) => {
    setGuardToDelete(guard);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!guardToDelete) return;

    startTransition(async () => {
      const result = await deleteGuard(guardToDelete.id);
      if (result.success) {
        toast.success(result.message);
        setGuards((prev) => prev.filter((g) => g.id !== guardToDelete.id));
      } else {
        toast.error(result.message);
      }
      setDeleteDialogOpen(false);
      setGuardToDelete(null);
    });
  }, [guardToDelete]);

  // Column actions
  const actions: GuardActions = useMemo(
    () => ({
      onToggleActive: handleToggleStatus,
      onDelete: handleDelete,
    }),
    [handleToggleStatus, handleDelete]
  );

  const columns = useMemo(() => getGuardColumns(actions), [actions]);

  // We use client-side table logic here since the list is small
  const table = useReactTable({
    data: guards,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination,
      globalFilter,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search guards..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 ml-auto">
              <Plus className="h-4 w-4" />
              Add Guard
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Guard Account</DialogTitle>
              <DialogDescription>
                Add a new security guard with email and password authentication.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGuard}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter guard's full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="guard@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Guard"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white">
        <DataTable
          columns={columns}
          data={guards}
          pageCount={table.getPageCount()}
          pagination={pagination}
          onPaginationChange={setPagination}
          // We don't pass toolbar here because we rendered it manually above to include the Add button
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guard Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{guardToDelete?.fullName || guardToDelete?.email}</strong>
              ? This action cannot be undone. The guard will lose access to the
              mobile app.
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
