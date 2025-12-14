"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  MapPin,
  Plus,
  MoreVertical,
  Clock,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  createEvent,
  updateEvent,
  setActiveEvent,
  updateEventStatus,
  type EventData,
  type EventInput,
} from "@/actions/settings-actions";

interface EventsManagerProps {
  initialEvents: EventData[];
}

export function EventsManager({ initialEvents }: EventsManagerProps) {
  const [events] = useState<EventData[]>(initialEvents);
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<EventInput>>({
    name: "",
    venue: "",
    date: new Date().toISOString().split("T")[0],
    ticketPrice: 2000,
  });

  const handleOpenDialog = (event?: EventData) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        name: event.name,
        venue: event.venue || "",
        date: new Date(event.date).toISOString().split("T")[0],
        ticketPrice: event.ticketPrice,
        description: event.description || "",
      });
    } else {
      setEditingEvent(null);
      setFormData({
        name: "",
        venue: "",
        date: new Date().toISOString().split("T")[0],
        ticketPrice: 2000,
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.date) {
      toast.error("Name and Date are required");
      return;
    }

    startTransition(async () => {
      const input: EventInput = {
        name: formData.name!,
        date: new Date(formData.date!).toISOString(),
        venue: formData.venue,
        ticketPrice: formData.ticketPrice || 0,
        description: formData.description,
      };

      let res;
      if (editingEvent) {
        res = await updateEvent(editingEvent.id, input);
      } else {
        res = await createEvent(input);
      }

      if (res.success) {
        toast.success(
          editingEvent ? "Event updated" : "Event created successfully"
        );
        setIsDialogOpen(false);
        // In a real app, we'd refresh data here or use router.refresh()
        // For now, we rely on the server action revalidating the page
        window.location.reload();
      } else {
        toast.error(res.error || "Operation failed");
      }
    });
  };

  const handleSetActive = (eventId: string) => {
    startTransition(async () => {
      const res = await setActiveEvent(eventId);
      if (res.success) {
        toast.success("Active event updated");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to set active event");
      }
    });
  };

  const handleStatusChange = (
    eventId: string,
    status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  ) => {
    startTransition(async () => {
      const res = await updateEventStatus(eventId, status);
      if (res.success) {
        toast.success("Status updated");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Events Management
          </CardTitle>
          <CardDescription>
            Create and manage events. The &quot;Default&quot; event is used for
            current operations.
          </CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                event.isDefault
                  ? "border-blue-200 bg-blue-50/50"
                  : "border-slate-100 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-lg ${
                    event.isDefault ? "bg-blue-100" : "bg-slate-100"
                  }`}
                >
                  <Calendar
                    className={`h-6 w-6 ${
                      event.isDefault ? "text-blue-600" : "text-slate-500"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {event.name}
                    </h3>
                    {event.isDefault && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                        Active
                      </Badge>
                    )}
                    <Badge variant="outline">{event.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                      }).format(new Date(event.date))}
                    </span>
                    {event.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.venue}
                      </span>
                    )}
                    <span>Rs. {event.ticketPrice}</span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleOpenDialog(event)}>
                    Edit Details
                  </DropdownMenuItem>
                  {!event.isDefault && (
                    <DropdownMenuItem onClick={() => handleSetActive(event.id)}>
                      Set as Active
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(event.id, "DRAFT")}
                  >
                    Set Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(event.id, "PUBLISHED")}
                  >
                    Set Published
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(event.id, "COMPLETED")}
                  >
                    Set Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No events found. Create one to get started.
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
            <DialogDescription>
              Configure event details. Active events control ticket pricing and
              access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Annual Qawwali Night 2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ticket Price (PKR)</Label>
                <Input
                  type="number"
                  value={formData.ticketPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ticketPrice: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input
                value={formData.venue}
                onChange={(e) =>
                  setFormData({ ...formData, venue: e.target.value })
                }
                placeholder="e.g. Main Auditorium"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Event details..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
