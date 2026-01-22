import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { NextResponse } from "next/server";
import { Buffer } from "buffer";

/**
 * Create a new jsPDF instance with proper configuration for Indonesian text
 * This helper ensures that Indonesian characters are properly encoded
 */
export function createPDF(orientation = "portrait") {
  const doc = new jsPDF({
    orientation: orientation,
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
  });

  // Set default font to helvetica which supports basic Latin characters
  doc.setFont("helvetica");

  return doc;
}

/**
 * Safely add text to PDF with proper encoding
 * Converts text to ensure compatibility with jsPDF
 */
export function addText(doc, text, x, y, options = {}) {
  // Convert text to ensure it's properly encoded
  const safeText = String(text || "").normalize("NFC");

  if (options.align) {
    doc.text(safeText, x, y, { align: options.align });
  } else {
    doc.text(safeText, x, y);
  }
}

/**
 * Create an autoTable with proper text encoding
 */
export function createAutoTable(doc, config) {
  // Process headers to ensure proper encoding
  if (config.head) {
    config.head = config.head.map((row) =>
      row.map((cell) => String(cell || "").normalize("NFC"))
    );
  }

  // Process body to ensure proper encoding
  if (config.body) {
    config.body = config.body.map((row) =>
      row.map((cell) => {
        if (cell === null || cell === undefined) return "-";
        return String(cell).normalize("NFC");
      })
    );
  }

  // Call autoTable with doc as context
  autoTable(doc, config);
}

/**
 * Convert PDF to Buffer for response
 */
export function pdfToBuffer(doc) {
  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Create PDF response with proper headers
 */
export function createPDFResponse(pdfBuffer, filename) {
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

/**
 * Get month name in Indonesian
 */
export function getMonthName(month) {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return months[parseInt(month) - 1] || "";
}

/**
 * Get grade letter based on score
 */
export function getNilaiHuruf(nilai) {
  if (nilai >= 90) return "A";
  if (nilai >= 80) return "B";
  if (nilai >= 70) return "C";
  if (nilai >= 60) return "D";
  return "E";
}

/**
 * Get predicate based on score
 */
export function getPredikat(nilai) {
  if (nilai >= 90) return "Sangat Baik";
  if (nilai >= 80) return "Baik";
  if (nilai >= 70) return "Cukup";
  if (nilai >= 60) return "Kurang";
  return "Sangat Kurang";
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(date) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return "-";
  }
}

/**
 * Sanitize filename to remove invalid characters
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();
}
