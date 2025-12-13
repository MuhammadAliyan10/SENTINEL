"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createManager } from "@/actions/managers-actions";
import { type CreateManagerInput } from "@/lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateManagerDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateManagerInput>({
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      semester: "",
      section: "",
      role: "CR",
      gender: "MALE",
    },
  });

  const selectedRole = watch("role");
  const selectedGender = watch("gender");

  // Auto-select gender based on role
  // CR -> Male, GR -> Female
  if (selectedRole === "CR" && selectedGender !== "MALE") {
    setValue("gender", "MALE");
  } else if (selectedRole === "GR" && selectedGender !== "FEMALE") {
    setValue("gender", "FEMALE");
  }

  const onSubmit = (data: CreateManagerInput) => {
    startTransition(async () => {
      const result = await createManager(data);
      if (result.success) {
        toast.success(result.message);
        reset();
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Manager
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Manager</DialogTitle>
          <DialogDescription>
            Add a new Class Representative (CR) or Girls Representative (GR)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
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

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              autoComplete="off"
              type="email"
              placeholder="manager@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email",
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="off"
              placeholder="Min 6 characters"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Min 6 characters" },
              })}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Semester */}
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
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
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
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

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue("role", value as "CR" | "GR")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CR">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    CR (Male)
                  </div>
                </SelectItem>
                <SelectItem value="GR">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-pink-500" />
                    GR (Female)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Manager"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
