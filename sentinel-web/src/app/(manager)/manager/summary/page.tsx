"use client";

import { useEffect, useState } from "react";
import { getManagerSummary, ManagerSummary } from "@/actions/manager-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Wallet, Users, FileText, Loader2 } from "lucide-react";

export default function SummaryPage() {
  const [summary, setSummary] = useState<ManagerSummary | null>(null);

  useEffect(() => {
    getManagerSummary().then(setSummary);
  }, []);

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentDate = new Date();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Screen Header - Hidden in Print */}
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Collection Summary</h1>
        <Button onClick={() => window.print()} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Save PDF
        </Button>
      </div>

      {/* Printable Content */}
      <div className="print:p-4 space-y-6 bg-white print:bg-white">
        {/* Header */}
        <div className="text-center space-y-2 pb-4 border-b-2 border-primary/20">
          <h2 className="text-3xl font-bold text-primary print:text-black">
            SENTINEL
          </h2>
          <p className="text-lg font-medium">Manager Collection Report</p>
        </div>

        {/* Manager Info */}
        <Card className="border-primary/10 shadow-sm print:shadow-none print:border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Report Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Manager</p>
                <p className="font-semibold">
                  {summary.manager.fullName || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Section</p>
                <p className="font-semibold">
                  {summary.manager.section || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Semester</p>
                <p className="font-semibold">
                  {summary.manager.semester || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-semibold">
                  {currentDate.toLocaleDateString("en-PK", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-2 border-emerald-100 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Total Cash Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                Rs. {summary.stats.cashCollected.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                @ Rs. {summary.stats.ticketPrice} per pass
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Passes Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {summary.stats.totalPasses}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Students registered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Student Table */}
        {summary.students.length > 0 && (
          <Card className="shadow-none print:border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Pass Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px] font-semibold">#</TableHead>
                    <TableHead className="font-semibold">Full Name</TableHead>
                    <TableHead className="font-semibold">SAP ID</TableHead>
                    <TableHead className="font-semibold text-right">
                      Payment
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.fullName || "Unknown"}
                      </TableCell>
                      <TableCell className="font-mono">
                        {student.sapId}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        Rs. {summary.stats.ticketPrice}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {new Date(student.createdAt).toLocaleDateString(
                          "en-PK",
                          {
                            day: "2-digit",
                            month: "short",
                          }
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-6 border-t space-y-1">
          <p className="font-medium">
            Generated on {currentDate.toLocaleString()}
          </p>
          <p>Sentinel Access Control System</p>
          <p>Confidential Financial Document</p>
        </div>
      </div>
    </div>
  );
}
