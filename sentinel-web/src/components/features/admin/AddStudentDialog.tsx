"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createUser, type CreateUserInput } from "@/actions/user-actions";

interface AddStudentDialogProps {
  trigger?: React.ReactNode;
}

export function AddStudentDialog({ trigger }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateUserInput>({
    defaultValues: {
      fullName: "",
      sapId: "",
      email: "",
      isPaid: false,
    },
  });

  const onSubmit = async (data: CreateUserInput) => {
    setIsLoading(true);

    try {
      const result = await createUser(data);

      if (result.success) {
        toast.success(result.message);
        form.reset();
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Create a new student profile. A secure TOTP secret will be generated
            automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              {...form.register("fullName", { required: true })}
              disabled={isLoading}
            />
          </div>

          {/* SAP ID */}
          <div className="space-y-2">
            <Label htmlFor="sapId">SAP ID</Label>
            <Input
              id="sapId"
              placeholder="70168915"
              {...form.register("sapId", {
                required: true,
                pattern: /^[0-9]{8}$/,
              })}
              disabled={isLoading}
              className="font-mono text-lg tracking-wider"
              maxLength={8}
            />
            <p className="text-xs text-muted-foreground">
              8-digit SAP ID number
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@university.edu"
              {...form.register("email", { required: true })}
              disabled={isLoading}
            />
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isPaid" className="text-base">
                Payment Received
              </Label>
              <p className="text-sm text-muted-foreground">
                Mark if the student has paid their fees
              </p>
            </div>
            <Switch
              id="isPaid"
              checked={form.watch("isPaid")}
              onCheckedChange={(checked) => form.setValue("isPaid", checked)}
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Student
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
