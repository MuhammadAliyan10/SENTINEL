import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BulkUpload } from "@/components/admin/BulkUpload";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Download, AlertCircle } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bulk Upload</h1>
        <p className="text-muted-foreground mt-1">
          Import students from CSV files
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Card */}
        <Card className="bg-white border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle>Import Students</CardTitle>
            </div>
            <CardDescription>
              Upload a CSV file to add multiple students at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-foreground font-medium mb-2">
                Ready to import students?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV with SAP IDs and names
              </p>
              <BulkUpload
                trigger={
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Select CSV File
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="bg-white border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <CardTitle>CSV Format Guide</CardTitle>
            </div>
            <CardDescription>Required format for bulk import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Required Columns:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>
                  <code className="bg-slate-100 px-1 rounded">sap_id</code> -
                  8-digit SAP ID (e.g., 70168915)
                </li>
                <li>
                  <code className="bg-slate-100 px-1 rounded">full_name</code> -
                  Student&apos;s full name
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-foreground">Optional Columns:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>
                  <code className="bg-slate-100 px-1 rounded">email</code> -
                  Student email
                </li>
                <li>
                  <code className="bg-slate-100 px-1 rounded">
                    payment_status
                  </code>{" "}
                  - true/false or yes/no
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-border">
              <p className="text-xs font-mono text-muted-foreground">
                sap_id,full_name,email,payment_status
                <br />
                70168915,Ahmed Khan,ahmed@uni.edu,true
                <br />
                70168916,Sara Ali,sara@uni.edu,false
              </p>
            </div>

            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Important Notes */}
      <Card className="bg-amber-50 border-amber-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800">Important Notes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
            <li>SAP IDs must be unique 8-digit numbers</li>
            <li>Duplicate SAP IDs will be rejected</li>
            <li>TOTP secrets are auto-generated for each student</li>
            <li>Maximum 2,000 students per upload</li>
            <li>Students will receive login credentials via email</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
