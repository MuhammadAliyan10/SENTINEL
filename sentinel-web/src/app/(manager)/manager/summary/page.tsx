"use client";

import { useEffect, useState } from "react";
import { getManagerSummary, ManagerSummary } from "@/actions/manager-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Download,
  Wallet,
  Users,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { generateManagerSummaryPDF } from "@/lib/pdf-generator";

const STUDENTS_PER_PAGE = 10;

export default function SummaryPage() {
  const [summary, setSummary] = useState<ManagerSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getManagerSummary().then(setSummary);
  }, []);

  const handleDownloadPDF = () => {
    if (!summary) return;

    setIsGenerating(true);
    try {
      generateManagerSummaryPDF(summary);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentDate = new Date();

  // Pagination logic
  const totalStudents = summary.students.length;
  const totalPages = Math.ceil(totalStudents / STUDENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
  const endIndex = startIndex + STUDENTS_PER_PAGE;
  const paginatedStudents = summary.students.slice(startIndex, endIndex);
  const showPagination = totalStudents > STUDENTS_PER_PAGE;

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

      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-6">
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
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>

        {/* Printable Content */}
        <div className="space-y-4 md:space-y-6 bg-white print:p-0">
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
                <div className="text-xl md:text-2xl font-bold text-emerald-600">
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

          {/* Student List */}
          {summary.students.length > 0 && (
            <Card className="shadow-none print:border">
              <CardHeader className="pb-2 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Pass Recipients ({summary.students.length} students)
                  </CardTitle>
                  {showPagination && (
                    <p className="text-xs text-muted-foreground print-hide">
                      Showing {startIndex + 1}-
                      {Math.min(endIndex, totalStudents)} of {totalStudents}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left font-semibold px-3 md:px-6 py-3.5 text-sm">
                          Full Name
                        </th>
                        <th className="text-left font-semibold px-3 md:px-6 py-3.5 text-sm">
                          SAP ID
                        </th>
                        <th className="text-right font-semibold px-3 md:px-6 py-3.5 text-sm">
                          Date & Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.map((student, index) => (
                        <tr
                          key={student.id}
                          className="border-b last:border-0 print-break-inside-avoid hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 md:px-6 py-3">
                            <div className="font-medium text-sm">
                              {student.fullName || "Unknown"}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 font-mono text-sm text-muted-foreground">
                            {student.sapId}
                          </td>
                          <td className="px-3 md:px-6 py-3 text-right">
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="font-medium text-sm text-foreground">
                                {new Date(student.createdAt).toLocaleDateString(
                                  "en-PK",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(student.createdAt).toLocaleTimeString(
                                  "en-PK",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-background">
                      <tr className="bg-muted/30 font-semibold border-t-2">
                        <td
                          colSpan={2}
                          className="px-3 md:px-6 py-4 text-left text-sm"
                        >
                          Total ({summary.students.length} students):
                        </td>
                        <td className="px-3 md:px-6 py-4 text-right text-emerald-600 font-bold text-base">
                          Rs. {summary.stats.cashCollected.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Pagination Controls */}
                {showPagination && (
                  <div className="flex items-center justify-between px-4 py-3 border-t print-hide">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 p-0 ${
                              currentPage === page
                                ? ""
                                : "text-muted-foreground"
                            }`}
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="gap-1"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
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
        </div>
      </div>
    </>
  );
}
