"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAllGuardsForExport } from "@/actions/guard-actions";
import { exportToCSV } from "@/lib/export";

export function ExportGuardsButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await getAllGuardsForExport();
      if (result.success) {
        exportToCSV(
          result.data,
          `guards_export_${new Date().toISOString().split("T")[0]}`,
          [
            { key: "fullName", header: "Full Name" },
            { key: "email", header: "Email" },
            { key: "createdAt", header: "Created Date" },
            { key: "isActive", header: "Status" },
            { key: "totalScans", header: "Total Scans" },
          ]
        );
        toast.success(`Exported ${result.data.length} guards`);
      } else {
        toast.error(result.message || "Export failed");
      }
    } catch (error) {
      toast.error("Export failed");
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
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}
