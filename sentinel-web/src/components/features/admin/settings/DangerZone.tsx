"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { purgeTestData } from "@/actions/settings-actions";

export function DangerZone() {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handlePurge = () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    startTransition(async () => {
      try {
        const result = await purgeTestData();

        if (result.success) {
          toast.success(result.message);
          setDialogOpen(false);
          setConfirmText("");
        } else {
          toast.error(result.message || "Failed to purge data");
        }
      } catch (error) {
        toast.error("An error occurred");
      }
    });
  };

  return (
    <>
      <div className="bg-white rounded-xl border-2 border-red-200 shadow-sm">
        <div className="p-6 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                Danger Zone
              </h3>
              <p className="text-sm text-red-600">
                Irreversible actions - proceed with caution
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-900">
                Purge All Test Data
              </h4>
              <p className="text-sm text-slate-500 mt-0.5">
                Deletes all AccessLogs but keeps User accounts intact.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Purge Data
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ⚠️ Confirm Data Purge
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This will permanently delete <strong>all Access Logs</strong>{" "}
                from the database. This action cannot be undone.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  Type "DELETE" to confirm:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE here"
                  className="border-red-200 focus:ring-red-500"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handlePurge}
              disabled={confirmText !== "DELETE" || isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Purging...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Purge All Data
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
