"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
  Download,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { importStudents, validateCSV } from "@/actions/bulk-import";
import type { CSVStudentRow } from "@/types/database";

interface BulkUploadProps {
  trigger?: React.ReactNode;
}

type UploadStage =
  | "idle"
  | "parsing"
  | "validating"
  | "preview"
  | "importing"
  | "complete"
  | "error";

export function BulkUpload({ trigger }: BulkUploadProps) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<CSVStudentRow[]>([]);
  const [validationResult, setValidationResult] = useState<{
    valid: number;
    invalid: number;
    errors: string[];
  } | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setStage("idle");
    setFileName(null);
    setParsedData([]);
    setValidationResult(null);
    setImportResult(null);
    setProgress(0);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setStage("parsing");
    setProgress(10);

    Papa.parse<CSVStudentRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) =>
        header.toLowerCase().trim().replace(/\s+/g, "_"),
      complete: async (results) => {
        setProgress(30);

        // Check if sap_id column exists
        const headers = Object.keys(results.data[0] || {});
        if (!headers.includes("sap_id")) {
          setStage("error");
          toast.error("CSV must have a 'sap_id' column");
          return;
        }

        setParsedData(results.data);
        setStage("validating");
        setProgress(50);

        // Validate on server
        const validation = await validateCSV(results.data);
        setValidationResult(validation);
        setProgress(70);
        setStage("preview");
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        setStage("error");
        toast.error("Failed to parse CSV file");
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB limit
    onDropRejected: (files) => {
      const error = files[0]?.errors[0];
      if (error?.code === "file-too-large") {
        toast.error("File is too large. Maximum size is 5MB.");
      } else {
        toast.error("Invalid file. Please upload a CSV file under 5MB.");
      }
    },
    disabled: stage !== "idle",
  });

  const handleImport = async () => {
    setStage("importing");
    setProgress(80);

    const result = await importStudents(parsedData);

    setProgress(100);
    setImportResult({
      imported: result.imported,
      failed: result.failed,
      errors: result.errors,
    });

    if (result.success) {
      setStage("complete");
      toast.success(result.message);
    } else {
      setStage("error");
      toast.error(result.message);
    }
  };

  const downloadTemplate = () => {
    const template =
      "sap_id,full_name,email,payment_status\n70168915,Ahmed Khan,ahmed@university.edu,true\n70168916,Sara Ali,sara@university.edu,false";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple students at once. TOTP secrets
            will be generated automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Stage: Idle - Dropzone */}
        {stage === "idle" && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-slate-50"
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-foreground font-medium">
                {isDragActive
                  ? "Drop the CSV file here"
                  : "Drag & drop a CSV file"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <p className="text-xs text-muted-foreground">
                Required columns: sap_id, full_name
              </p>
            </div>
          </div>
        )}

        {/* Stage: Parsing/Validating */}
        {(stage === "parsing" || stage === "validating") && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
            <div>
              <p className="font-medium text-foreground">
                {stage === "parsing" ? "Parsing CSV..." : "Validating data..."}
              </p>
              <p className="text-sm text-muted-foreground">{fileName}</p>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Stage: Preview */}
        {stage === "preview" && validationResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="font-medium">{fileName}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={reset}
                className="ml-auto h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Valid Records
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {validationResult.valid}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">
                    Invalid Records
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  {validationResult.invalid}
                </p>
              </div>
            </div>

            {/* Errors List */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Validation Issues</span>
                </div>
                <ScrollArea className="h-32 rounded-md border border-border p-3">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {validationResult.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Stage: Importing */}
        {stage === "importing" && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
            <div>
              <p className="font-medium text-foreground">
                Importing students...
              </p>
              <p className="text-sm text-muted-foreground">
                Generating TOTP secrets and creating profiles
              </p>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Stage: Complete */}
        {stage === "complete" && importResult && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
            <div>
              <p className="text-xl font-bold text-foreground">
                Import Complete!
              </p>
              <p className="text-muted-foreground">
                Successfully imported {importResult.imported} students
              </p>
            </div>
            {importResult.failed > 0 && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                {importResult.failed} records skipped
              </Badge>
            )}
          </div>
        )}

        {/* Stage: Error */}
        {stage === "error" && (
          <div className="py-8 text-center space-y-4">
            <XCircle className="mx-auto h-16 w-16 text-red-600" />
            <div>
              <p className="text-xl font-bold text-foreground">Import Failed</p>
              <p className="text-muted-foreground">
                Please check the file and try again
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {stage === "idle" && (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          )}

          {stage === "preview" && validationResult && (
            <>
              <Button variant="outline" onClick={reset}>
                Choose Different File
              </Button>
              <Button
                onClick={handleImport}
                disabled={validationResult.valid === 0}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import {validationResult.valid} Students
              </Button>
            </>
          )}

          {(stage === "complete" || stage === "error") && (
            <Button
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
