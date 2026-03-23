import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  formatDate,
  formatDateTime,
  formatEnumLabel,
  parseApiDate,
} from "./formatters.js";

const BRAND_PRIMARY = [0, 196, 204];
const BRAND_SECONDARY = [0, 161, 168];
const TEXT_DARK = [44, 50, 63];
const TEXT_MUTED = [110, 118, 132];
const ALT_ROW = [240, 249, 255];

const safePercentage = (value, total) => {
  if (!total) {
    return "0.0%";
  }

  return `${((value / total) * 100).toFixed(1)}%`;
};

const buildTable = (doc, options) => {
  autoTable(doc, {
    theme: "grid",
    margin: { left: 15, right: 15 },
    styles: {
      fontSize: 9,
      textColor: TEXT_DARK,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      textColor: TEXT_DARK,
    },
    alternateRowStyles: {
      fillColor: ALT_ROW,
    },
    ...options,
  });
};

const addPageFooter = (doc, generatedAt) => {
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setDrawColor(...BRAND_PRIMARY);
    doc.setLineWidth(0.4);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      "GIET University | Complaint Management System",
      15,
      pageHeight - 9,
    );
    doc.text(
      `Generated ${generatedAt} | Page ${page} of ${totalPages}`,
      pageWidth - 15,
      pageHeight - 9,
      { align: "right" },
    );
  }
};

export const generatePDFReport = (complaints, stats) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const sortedComplaints = [...complaints].sort(
    (a, b) =>
      (parseApiDate(b.created_at)?.getTime() || 0) -
      (parseApiDate(a.created_at)?.getTime() || 0),
  );

  const generatedAt = formatDateTime(new Date());
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 18;

  doc.setFontSize(23);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text("GIET University", pageWidth / 2, cursorY, { align: "center" });
  cursorY += 8;

  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Complaint Management System Report", pageWidth / 2, cursorY, {
    align: "center",
  });
  cursorY += 6;

  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Generated on ${generatedAt}`, pageWidth / 2, cursorY, {
    align: "center",
  });
  cursorY += 10;

  doc.setFontSize(12);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Key Performance Indicators", 15, cursorY);
  cursorY += 5;

  buildTable(doc, {
    startY: cursorY,
    head: [["Metric", "Value", "Percentage"]],
    body: [
      ["Total Complaints", String(stats.total), "100%"],
      [
        "Resolved",
        String(stats.resolved),
        safePercentage(stats.resolved, stats.total),
      ],
      [
        "In Progress / Assigned",
        String(stats.active),
        safePercentage(stats.active, stats.total),
      ],
      [
        "Pending",
        String(stats.pending),
        safePercentage(stats.pending, stats.total),
      ],
    ],
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "center" },
    },
  });

  cursorY = doc.lastAutoTable.finalY + 10;

  const categoryCounts = {
    HOSTEL: sortedComplaints.filter((item) => item.category === "HOSTEL")
      .length,
    ADMINISTRATIVE: sortedComplaints.filter(
      (item) => item.category === "ADMINISTRATIVE",
    ).length,
    ACADEMIC: sortedComplaints.filter((item) => item.category === "ACADEMIC")
      .length,
  };

  doc.setFontSize(12);
  doc.text("Complaints by Category", 15, cursorY);
  cursorY += 5;

  buildTable(doc, {
    startY: cursorY,
    head: [["Category", "Count", "Percentage"]],
    body: Object.entries(categoryCounts).map(([key, count]) => [
      formatEnumLabel(key),
      String(count),
      safePercentage(count, stats.total),
    ]),
    headStyles: {
      fillColor: BRAND_SECONDARY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "center" },
    },
  });

  cursorY = doc.lastAutoTable.finalY + 10;

  const statusKeys = [
    "PENDING",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "REJECTED",
  ];
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Complaints by Status", 15, cursorY);
  cursorY += 5;

  buildTable(doc, {
    startY: cursorY,
    head: [["Status", "Count", "Percentage"]],
    body: statusKeys.map((status) => {
      const count = sortedComplaints.filter(
        (item) => item.status === status,
      ).length;
      return [
        formatEnumLabel(status),
        String(count),
        safePercentage(count, stats.total),
      ];
    }),
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "center" },
    },
  });

  doc.addPage();
  cursorY = 18;

  doc.setFontSize(12);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Detailed Complaint Register", 15, cursorY);
  cursorY += 5;

  buildTable(doc, {
    startY: cursorY,
    head: [
      [
        "ID",
        "Title",
        "Category",
        "Status",
        "Priority",
        "Filed On",
        "Assigned Staff",
      ],
    ],
    body: sortedComplaints
      .slice(0, 100)
      .map((complaint) => [
        `#${complaint.id ?? "N/A"}`,
        complaint.title || "Untitled",
        formatEnumLabel(complaint.category) || "N/A",
        formatEnumLabel(complaint.status) || "N/A",
        complaint.priority_level || "N/A",
        formatDate(complaint.created_at, "short"),
        complaint.assigned_to ? `#${complaint.assigned_to}` : "Unassigned",
      ]),
    styles: {
      fontSize: 8,
      textColor: TEXT_DARK,
      cellPadding: 2.5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 42 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 22, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
    },
  });

  addPageFooter(doc, generatedAt);

  const filename = `complaint_report_${formatDate(new Date(), "iso")}.pdf`;
  doc.save(filename);
  return filename;
};
