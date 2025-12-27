"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Calendar } from "lucide-react";
import { updateEvent } from "@/actions/settings-actions";

const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  venue: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  ticketPrice: z.number().min(0, "Price cannot be negative"),
  maxCapacity: z.number().min(1, "Capacity must be at least 1"),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventConfigFormProps {
  event: {
    id: string;
    name: string;
    venue: string | null;
    date: Date | string;
    ticketPrice: number;
    maxCapacity: number | null;
  };
}

export function EventConfigForm({ event }: EventConfigFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: event.name,
      venue: event.venue || "",
      date: new Date(event.date).toISOString().split("T")[0],
      ticketPrice: event.ticketPrice,
      maxCapacity: event.maxCapacity || 800,
    },
  });

  const onSubmit = (data: EventFormData) => {
    startTransition(async () => {
      try {
        const result = await updateEvent(event.id, {
          name: data.name,
          venue: data.venue || undefined,
          date: data.date,
          ticketPrice: data.ticketPrice,
          maxCapacity: data.maxCapacity,
        });

        if (result.success) {
          toast.success("Event updated successfully");
        } else {
          toast.error(result.error || "Failed to update event");
        }
      } catch (error) {
        toast.error("An error occurred");
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4F39F6]/10 rounded-lg">
            <Calendar className="h-5 w-5 text-[#4F39F6]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Event Configuration
            </h3>
            <p className="text-sm text-slate-500">
              Manage the active event details
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700">
              Event Name
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Annual Dinner 2026"
              className="border-slate-200"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <Label htmlFor="venue" className="text-slate-700">
              Venue
            </Label>
            <Input
              id="venue"
              {...register("venue")}
              placeholder="e.g., Royal Palm Golf Club"
              className="border-slate-200"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-slate-700">
              Event Date
            </Label>
            <Input
              id="date"
              type="date"
              {...register("date")}
              className="border-slate-200"
            />
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Ticket Price */}
          <div className="space-y-2">
            <Label htmlFor="ticketPrice" className="text-slate-700">
              Ticket Price (PKR)
            </Label>
            <Input
              id="ticketPrice"
              type="number"
              {...register("ticketPrice", { valueAsNumber: true })}
              className="border-slate-200"
            />
            {errors.ticketPrice && (
              <p className="text-xs text-red-500">
                {errors.ticketPrice.message}
              </p>
            )}
          </div>

          {/* Max Capacity */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="maxCapacity" className="text-slate-700">
              Maximum Capacity
            </Label>
            <Input
              id="maxCapacity"
              type="number"
              {...register("maxCapacity", { valueAsNumber: true })}
              className="border-slate-200 max-w-xs"
            />
            {errors.maxCapacity && (
              <p className="text-xs text-red-500">
                {errors.maxCapacity.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={isPending || !isDirty}
            className="bg-[#4F39F6] hover:bg-[#4F39F6]/90"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
