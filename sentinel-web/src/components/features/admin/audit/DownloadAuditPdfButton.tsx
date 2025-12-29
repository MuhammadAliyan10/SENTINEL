"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generateAuditReportPDF, AuditReportData } from "@/lib/pdf-generator";

interface DownloadAuditPdfButtonProps {
  data: AuditReportData;
}

export function DownloadAuditPdfButton({ data }: DownloadAuditPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    try {
      generateAuditReportPDF(data);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownloadPDF} disabled={isGenerating}>
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Download PDF
    </Button>
  );
}
