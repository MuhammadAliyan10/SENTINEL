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
  // SIGNATURE SECTION
  // ============================================

  const pageHeight = doc.internal.pageSize.getHeight();
  const signY = pageHeight - 55;

  // Signature lines
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Left signature - Manager
  doc.line(14, signY + 20, 80, signY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text("Manager Signature", 14, signY + 26);
  doc.text("Date: ____________", 14, signY + 34);

  // Right signature - Verified By (Head)
  doc.line(pageWidth - 80, signY + 20, pageWidth - 14, signY + 20);
  doc.text("Verified By (Head)", pageWidth - 80, signY + 26);
  doc.text("Date: ____________", pageWidth - 80, signY + 34);

  // ============================================
  // FOOTER
  // ============================================

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  doc.text(
    `Generated: ${currentDate.toLocaleString("en-PK")}`,
    14,
    pageHeight - 12
  );
  doc.text("SENTINEL Access Control System", pageWidth / 2, pageHeight - 12, {
    align: "center",
  });
  doc.text("Confidential", pageWidth - 14, pageHeight - 12, {
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

// ============================================
// AUDIT REPORT PDF GENERATOR
// ============================================

export interface AuditManager {
  id: string;
  sapId: string;
  fullName: string | null;
  role: string;
  section: string | null;
  semester: string | null;
  isActive: boolean;
  studentsCount: number;
}

export interface AuditReportData {
  managers: AuditManager[];
  ticketPrice: number;
  totalStudents: number;
  totalCash: number;
  activeManagers: number;
  totalManagers: number;
}

/**
 * Generate a professional audit report PDF
 */
export function generateAuditReportPDF(data: AuditReportData): void {
  const doc = new jsPDF();
  const currentDate = new Date();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors - Black & White only
  const black: [number, number, number] = [0, 0, 0];
  const darkGray: [number, number, number] = [50, 50, 50];
  const lightGray: [number, number, number] = [100, 100, 100];

  let y = 20;

  // ============================================
  // HEADER
  // ============================================

  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SENTINEL", pageWidth / 2, y, { align: "center" });

  y += 8;
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Financial Audit Ledger", pageWidth / 2, y, { align: "center" });

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
  // SUMMARY SECTION
  // ============================================

  y += 12;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Audit Summary", 14, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const leftCol = 14;
  const rightCol = 110;

  // Left column - Managers
  doc.setFont("helvetica", "bold");
  doc.text("Active Managers:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.activeManagers} / ${data.totalManagers}`, leftCol + 35, y);

  // Right column - Date
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

  // Total Students
  doc.setFont("helvetica", "bold");
  doc.text("Total Students:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.totalStudents.toLocaleString(), leftCol + 35, y);

  // Ticket Price
  doc.setFont("helvetica", "bold");
  doc.text("Ticket Price:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Rs. ${data.ticketPrice.toLocaleString()}`, rightCol + 28, y);

  y += 7;

  // Total Expected Cash
  doc.setFont("helvetica", "bold");
  doc.text("Total Expected Cash:", leftCol, y);
  doc.setFontSize(12);
  doc.text(`Rs. ${data.totalCash.toLocaleString()}`, leftCol + 42, y);

  // ============================================
  // MANAGER LIABILITY TABLE
  // ============================================

  y += 15;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(14, y, pageWidth - 14, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(
    `Manager Liability Report (${data.managers.length} managers)`,
    14,
    y
  );

  y += 5;

  if (data.managers.length > 0) {
    const tableData = data.managers.map((manager, index) => {
      const semDisplay = manager.semester
        ? (() => {
            const sem = Number(manager.semester);
            const suffix =
              sem === 1 ? "st" : sem === 2 ? "nd" : sem === 3 ? "rd" : "th";
            return `${sem}${suffix}`;
          })()
        : "";
      const classDisplay =
        semDisplay && manager.section
          ? `${semDisplay}-${manager.section}`
          : semDisplay || manager.section || "—";

      const cashAmount = manager.studentsCount * data.ticketPrice;

      return [
        (index + 1).toString(),
        classDisplay,
        manager.fullName || "Unnamed",
        manager.role,
        manager.studentsCount.toString(),
        `Rs. ${cashAmount.toLocaleString()}`,
        manager.isActive ? "Active" : "Frozen",
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [
        [
          "#",
          "Semester",
          "Manager Name",
          "Role",
          "Students",
          "Cash Liability",
          "Status",
        ],
      ],
      body: tableData,
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 4,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [40, 40, 40],
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { halign: "center", cellWidth: 22 },
        2: { cellWidth: 50 },
        3: { halign: "center", cellWidth: 18 },
        4: { halign: "center", cellWidth: 22 },
        5: { halign: "right", cellWidth: 32 },
        6: { halign: "center", cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
      theme: "grid",
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
      },
    });

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY || y + 50;

    // ============================================
    // GRAND TOTAL SECTION (Print-friendly)
    // ============================================

    const totalY = finalY + 12;

    // Draw a simple bordered box
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(14, totalY, pageWidth - 28, 24);

    // Inner separator line
    doc.setLineWidth(0.2);
    doc.line(pageWidth / 2, totalY, pageWidth / 2, totalY + 24);

    // Left side - Labels
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("GRAND TOTAL", 20, totalY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `${data.activeManagers} Active / ${data.totalManagers} Total Managers`,
      20,
      totalY + 18
    );

    // Right side - Financial summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      `Total Students: ${data.totalStudents}`,
      pageWidth / 2 + 10,
      totalY + 10
    );

    doc.setFontSize(12);
    doc.text(
      `Total Cash: Rs. ${data.totalCash.toLocaleString()}`,
      pageWidth / 2 + 10,
      totalY + 19
    );
  }

  // ============================================
  // SIGNATURE SECTION
  // ============================================

  const pageHeight = doc.internal.pageSize.getHeight();
  const signY = pageHeight - 55;

  // Signature lines
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Left signature - Prepared By
  doc.line(14, signY + 20, 80, signY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text("Prepared By", 14, signY + 26);
  doc.text("Date: ____________", 14, signY + 34);

  // Right signature - Verified By (Head)
  doc.line(pageWidth - 80, signY + 20, pageWidth - 14, signY + 20);
  doc.text("Verified By (Head)", pageWidth - 80, signY + 26);
  doc.text("Date: ____________", pageWidth - 80, signY + 34);

  // ============================================
  // FOOTER
  // ============================================

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  doc.text(
    `Generated: ${currentDate.toLocaleString("en-PK")}`,
    14,
    pageHeight - 12
  );
  doc.text("SENTINEL Access Control System", pageWidth / 2, pageHeight - 12, {
    align: "center",
  });
  doc.text("Confidential", pageWidth - 14, pageHeight - 12, {
    align: "right",
  });

  // ============================================
  // SAVE PDF
  // ============================================

  const fileName = `SENTINEL_Audit_Report_${
    currentDate.toISOString().split("T")[0]
  }.pdf`;
  doc.save(fileName);
}
