"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getAttendeesForExport,
  AttendeeExport,
} from "@/actions/students-actions";

export function ExportAttendeesButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const result = await getAttendeesForExport();

      if (!result.success) {
        toast.error(result.message || "Failed to export attendees");
        return;
      }

      if (result.data.length === 0) {
        toast.warning("No attendees to export");
        return;
      }

      // Convert to CSV
      const csvContent = convertToCSV(result.data);

      // Trigger download
      const date = new Date().toISOString().split("T")[0];
      downloadCSV(csvContent, `sentinel_attendees_${date}.csv`);

      toast.success(`Exported ${result.data.length} attendees`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export attendees");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </>
      )}
    </Button>
  );
}

function convertToCSV(data: AttendeeExport[]): string {
  const headers = [
    "SAP ID",
    "Full Name",
    "Gender",
    "Section",
    "Semester",
    "Entry Time",
  ];
  const rows = data.map((row) => [
    row.sapId,
    row.fullName,
    row.gender,
    row.section,
    row.semester,
    row.entryTime,
  ]);

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ];

  return csvRows.join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
