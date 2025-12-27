"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAllAuditLogsForExport } from "@/actions/audit-actions";
import { exportToCSV } from "@/lib/export";

export function ExportAuditLogsButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await getAllAuditLogsForExport();
      if (result.success) {
        if (result.data.length === 0) {
          toast.warning("No audit logs to export");
          return;
        }
        exportToCSV(
          result.data,
          `audit_logs_${new Date().toISOString().split("T")[0]}`,
          [
            { key: "timestamp", header: "Timestamp" },
            { key: "action", header: "Action" },
            { key: "performerName", header: "Performed By" },
            { key: "targetId", header: "Target ID" },
            { key: "details", header: "Details" },
            { key: "ipAddress", header: "IP Address" },
          ]
        );
        toast.success(`Exported ${result.data.length} audit logs`);
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
    <Button onClick={handleExport} disabled={isExporting} variant="outline">
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
