"use client";

import { useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Shield,
  Plus,
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  createGuard,
  deleteGuard,
  toggleGuardStatus,
  type GuardListItem,
} from "@/actions/guard-actions";

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

  const handleToggleStatus = (guard: GuardListItem) => {
    startTransition(async () => {
      // Optimistic update
      setGuards(
        guards.map((g) =>
          g.id === guard.id ? { ...g, isActive: !g.isActive } : g
        )
      );

      const result = await toggleGuardStatus(guard.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        // Revert on error
        setGuards(
          guards.map((g) =>
            g.id === guard.id ? { ...g, isActive: guard.isActive } : g
          )
        );
      }
    });
  };

  const handleDelete = (guard: GuardListItem) => {
    setGuardToDelete(guard);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!guardToDelete) return;

    startTransition(async () => {
      const result = await deleteGuard(guardToDelete.id);
      if (result.success) {
        toast.success(result.message);
        setGuards(guards.filter((g) => g.id !== guardToDelete.id));
      } else {
        toast.error(result.message);
      }
      setDeleteDialogOpen(false);
      setGuardToDelete(null);
    });
  };

  return (
    <>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Guard Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage security guard accounts for mobile access
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
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

      {/* Guards Table */}
      {guards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg">
          <Shield className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No guard accounts yet</p>
          <p className="text-sm">
            Click "Add Guard" to create your first account
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guards.map((guard) => (
                <TableRow
                  key={guard.id}
                  className={!guard.isActive ? "opacity-50" : ""}
                >
                  <TableCell className="font-medium">
                    {guard.fullName || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {guard.email}
                  </TableCell>
                  <TableCell>
                    {new Date(guard.createdAt).toLocaleDateString("en-PK", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={guard.isActive}
                        onCheckedChange={() => handleToggleStatus(guard)}
                        disabled={isPending}
                      />
                      <span className="text-xs text-muted-foreground">
                        {guard.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(guard)}
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
        </div>
      )}

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
