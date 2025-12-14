"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { updateManager, type ManagerDetail } from "@/actions/managers-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditManagerInput {
  fullName: string;
  section: string;
  semester: string;
}

interface EditManagerDialogProps {
  manager: ManagerDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditManagerDialog({
  manager,
  open,
  onOpenChange,
}: EditManagerDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditManagerInput>({
    defaultValues: {
      fullName: manager.fullName || "",
      section: manager.section || "",
      semester: manager.semester || "",
    },
  });

  const onSubmit = (data: EditManagerInput) => {
    startTransition(async () => {
      const result = await updateManager(manager.id, data);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Manager</DialogTitle>
          <DialogDescription>
            Update details for {manager.role} ({manager.sapId})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-fullName">Full Name</Label>
            <Input
              id="edit-fullName"
              placeholder="Enter full name"
              {...register("fullName", {
                required: "Full name is required",
                minLength: { value: 2, message: "Name too short" },
              })}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Semester */}
            <div className="space-y-2">
              <Label htmlFor="edit-semester">Semester</Label>
              <Input
                id="edit-semester"
                autoComplete="off"
                placeholder="e.g. 8"
                {...register("semester", {
                  required: "Required",
                })}
              />
              {errors.semester && (
                <p className="text-sm text-destructive">
                  {errors.semester.message}
                </p>
              )}
            </div>

            {/* Section */}
            <div className="space-y-2">
              <Label htmlFor="edit-section">Section</Label>
              <Input
                id="edit-section"
                autoComplete="off"
                placeholder="e.g. A"
                {...register("section", {
                  required: "Required",
                })}
              />
              {errors.section && (
                <p className="text-sm text-destructive">
                  {errors.section.message}
                </p>
              )}
            </div>
          </div>

          {/* Role is read-only */}
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted text-muted-foreground">
              <span
                className={`h-2 w-2 rounded-full ${
                  manager.role === "CR" ? "bg-blue-500" : "bg-pink-500"
                }`}
              />
              {manager.role === "CR" ? "CR (Class Rep)" : "GR (Girls Rep)"}
            </div>
            <p className="text-xs text-muted-foreground">
              Role cannot be changed after creation.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
