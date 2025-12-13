"use client";

import { useEffect, useState } from "react";
import { getManagerSummary, ManagerSummary } from "@/actions/manager-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Wallet, Users, FileText, Loader2 } from "lucide-react";
import Image from "next/image";

export default function SummaryPage() {
  const [summary, setSummary] = useState<ManagerSummary | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    getManagerSummary().then(setSummary);
  }, []);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentDate = new Date();

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hide {
            display: none !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
          }
          table {
            font-size: 10px;
          }
          th,
          td {
            padding: 6px 8px !important;
          }
        }
      `}</style>

      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Screen Header - Hidden in Print */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print-hide">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              Collection Summary
            </h1>
            <p className="text-sm text-muted-foreground">
              Download or print your financial report
            </p>
          </div>
          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full sm:w-auto"
          >
            {isPrinting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>

        {/* Printable Content */}
        <div className="space-y-4 md:space-y-6 bg-white print:p-0">
          {/* Header with Logo */}
          <div className="text-center space-y-2 pb-4 border-b-2 border-primary/20 print-break-inside-avoid">
            <div className="flex justify-center">
              <Image
                src="/UniversityLogo.jpeg"
                alt="University Logo"
                width={80}
                height={80}
                className="print:w-16 print:h-16"
              />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-primary print:text-black">
              Manager Collection Report
            </h2>
            <p className="text-sm text-muted-foreground">
              SENTINEL Access Control System
            </p>
          </div>

          {/* Manager Info - Responsive Grid */}
          <Card className="border-primary/10 shadow-sm print:shadow-none print:border print-break-inside-avoid">
            <CardHeader className="pb-2 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Report Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Manager</p>
                  <p className="font-semibold truncate">
                    {summary.manager.fullName || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Section</p>
                  <p className="font-semibold">
                    {summary.manager.section || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Semester</p>
                  <p className="font-semibold">
                    {summary.manager.semester || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
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

          {/* Stats Cards - Responsive */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 print-break-inside-avoid">
            <Card className="border-2 border-emerald-100 shadow-none">
              <CardHeader className="pb-1 px-3 md:px-4">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Total Cash Collected</span>
                  <span className="sm:hidden">Cash</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 md:px-4 pb-3">
                <div className="text-xl md:text-3xl font-bold text-emerald-600">
                  Rs. {summary.stats.cashCollected.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  @ Rs. {summary.stats.ticketPrice} per pass
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 shadow-none">
              <CardHeader className="pb-1 px-3 md:px-4">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Total Passes Issued</span>
                  <span className="sm:hidden">Passes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 md:px-4 pb-3">
                <div className="text-xl md:text-3xl font-bold text-primary">
                  {summary.stats.totalPasses}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Students registered
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Student List - Proper Table for PDF */}
          {summary.students.length > 0 && (
            <Card className="shadow-none print:border">
              <CardHeader className="pb-2 px-4">
                <CardTitle className="text-sm font-medium">
                  Pass Recipients ({summary.students.length} students)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left font-semibold px-4 py-2 w-12">
                        #
                      </th>
                      <th className="text-left font-semibold px-4 py-2">
                        Full Name
                      </th>
                      <th className="text-left font-semibold px-4 py-2 hidden sm:table-cell">
                        SAP ID
                      </th>
                      <th className="text-right font-semibold px-4 py-2">
                        Amount
                      </th>
                      <th className="text-right font-semibold px-4 py-2 hidden md:table-cell">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.students.map((student, index) => (
                      <tr
                        key={student.id}
                        className="border-b last:border-0 print-break-inside-avoid"
                      >
                        <td className="px-4 py-2 font-mono text-muted-foreground text-xs">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-medium truncate max-w-[150px] md:max-w-none">
                            {student.fullName || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground sm:hidden font-mono">
                            {student.sapId}
                          </div>
                        </td>
                        <td className="px-4 py-2 font-mono hidden sm:table-cell">
                          {student.sapId}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-emerald-600">
                          Rs. {summary.stats.ticketPrice}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground text-xs hidden md:table-cell">
                          {new Date(student.createdAt).toLocaleDateString(
                            "en-PK",
                            {
                              day: "2-digit",
                              month: "short",
                            }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-semibold">
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-right sm:hidden"
                      >
                        Total:
                      </td>
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-right hidden sm:table-cell"
                      >
                        Total ({summary.students.length} students):
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-bold">
                        Rs. {summary.stats.cashCollected.toLocaleString()}
                      </td>
                      <td className="hidden md:table-cell"></td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {summary.students.length === 0 && (
            <Card className="shadow-none">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No passes issued yet</p>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t space-y-1 print-break-inside-avoid">
            <p className="font-medium">
              Generated: {currentDate.toLocaleString("en-PK")}
            </p>
            <p>SENTINEL Access Control System</p>
            <p className="text-[10px]">Confidential Financial Document</p>
          </div>
        </div>
      </div>
    </>
  );
}
