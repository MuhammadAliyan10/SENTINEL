"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFStudent {
  id: string;
  fullName: string | null;
  sapId: string;
  createdAt: string;
}

export interface PDFSummaryData {
  manager: {
    fullName: string | null;
    section: string | null;
    semester: string | null;
  };
  stats: {
    cashCollected: number;
    totalPasses: number;
    ticketPrice: number;
  };
  students: PDFStudent[];
}

/**
 * Generate a professional black & white PDF report
 */
export function generateManagerSummaryPDF(data: PDFSummaryData): void {
  const doc = new jsPDF();
  const currentDate = new Date();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors - Black & White only
  const black: [number, number, number] = [0, 0, 0];
  const darkGray: [number, number, number] = [50, 50, 50];
  const lightGray: [number, number, number] = [100, 100, 100];

  let y = 20;

  // ============================================
  // HEADER - Simple and Professional
  // ============================================

  // Title
  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SENTINEL", pageWidth / 2, y, { align: "center" });

  y += 8;
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Manager Collection Report", pageWidth / 2, y, { align: "center" });

  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text("University Access Control System", pageWidth / 2, y, {
    align: "center",
  });

  // Horizontal line under header
  y += 8;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);

  // ============================================
  // REPORT INFORMATION
  // ============================================

  y += 12;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Report Information", 14, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const leftCol = 14;
  const rightCol = 110;

  // Left column
  doc.setFont("helvetica", "bold");
  doc.text("Manager:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.manager.fullName || "Unknown", leftCol + 25, y);

  // Right column
  doc.setFont("helvetica", "bold");
  doc.text("Report Date:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    currentDate.toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    rightCol + 28,
    y
  );

  y += 7;

  // Left column
  doc.setFont("helvetica", "bold");
  doc.text("Section:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.manager.section || "N/A", leftCol + 25, y);

  // Right column
  doc.setFont("helvetica", "bold");
  doc.text("Semester:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.manager.semester || "N/A", rightCol + 28, y);

  // ============================================
  // SUMMARY
  // ============================================

  y += 15;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(14, y, pageWidth - 14, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text("Summary", 14, y);

  y += 8;
  doc.setFontSize(10);

  // Total Passes
  doc.setFont("helvetica", "bold");
  doc.text("Total Passes Issued:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.stats.totalPasses} students`, leftCol + 42, y);

  // Ticket Price
  doc.setFont("helvetica", "bold");
  doc.text("Ticket Price:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Rs. ${data.stats.ticketPrice.toLocaleString()}`, rightCol + 28, y);

  y += 7;

  // Total Amount
  doc.setFont("helvetica", "bold");
  doc.text("Total Cash Collected:", leftCol, y);
  doc.setFontSize(12);
  doc.text(`Rs. ${data.stats.cashCollected.toLocaleString()}`, leftCol + 42, y);

  // ============================================
  // STUDENT TABLE
  // ============================================

  y += 15;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(14, y, pageWidth - 14, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Pass Recipients (${data.students.length} students)`, 14, y);

  y += 5;

  if (data.students.length > 0) {
    // Prepare table data
    const tableData = data.students.map((student, index) => {
      const createdDate = new Date(student.createdAt);
      return [
        (index + 1).toString(),
        student.fullName || "Unknown",
        student.sapId,
        `Rs. ${data.stats.ticketPrice.toLocaleString()}`,
        createdDate.toLocaleDateString("en-PK", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        createdDate.toLocaleTimeString("en-PK", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["#", "Full Name", "SAP ID", "Amount", "Date", "Time"]],
      body: tableData,
      headStyles: {
        fillColor: [40, 40, 40],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [30, 30, 30],
        cellPadding: 3,
      },
      footStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontSize: 10,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { cellWidth: 50 },
        2: { halign: "left", cellWidth: 28 },
        3: { halign: "right", cellWidth: 28 },
        4: { halign: "right", cellWidth: 28 },
        5: { halign: "right", cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
      theme: "grid",
      styles: {
        lineColor: [180, 180, 180],
        lineWidth: 0.1,
      },
    });
  }

  // ============================================
  // FOOTER
  // ============================================

  const pageHeight = doc.internal.pageSize.getHeight();

  // Separator line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 22, pageWidth - 14, pageHeight - 22);

  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  doc.text(
    `Generated: ${currentDate.toLocaleString("en-PK")}`,
    14,
    pageHeight - 15
  );
  doc.text("SENTINEL Access Control System", pageWidth / 2, pageHeight - 15, {
    align: "center",
  });
  doc.text("Confidential Document", pageWidth - 14, pageHeight - 15, {
    align: "right",
  });

  // ============================================
  // SAVE PDF
  // ============================================

  const fileName = `SENTINEL_Collection_Report_${
    data.manager.fullName?.replace(/\s+/g, "_") || "Manager"
  }_${currentDate.toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
