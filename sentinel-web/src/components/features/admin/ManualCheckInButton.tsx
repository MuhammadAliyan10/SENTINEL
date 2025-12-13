"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { manualCheckIn } from "@/actions/students-actions";

interface ManualCheckInButtonProps {
  studentId: string;
  studentName: string;
  sapId: string;
}

export function ManualCheckInButton({
  studentId,
  studentName,
  sapId,
}: ManualCheckInButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleCheckIn = () => {
    startTransition(async () => {
      const result = await manualCheckIn(studentId);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCheck className="mr-2 h-4 w-4" />
          Check In
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Manual Check-In</AlertDialogTitle>
          <AlertDialogDescription>
            This will manually check in <strong>{studentName}</strong> (SAP:{" "}
            {sapId}) to the event.
            <br />
            <br />
            Use this only if the scanner is not working or the student forgot
            their phone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCheckIn} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking In...
              </>
            ) : (
              "Confirm Check-In"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
