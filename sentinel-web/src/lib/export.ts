// ============================================
// CSV Export Utility
// ============================================
// Reusable utility for exporting data to CSV format
// Used in admin panel for students, logs, guards export

/**
 * Convert an array of objects to CSV string
 */
export function objectsToCSV<T extends object>(
  data: T[],
  columns?: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return "";

  // If columns specified, use them; otherwise use all keys from first object
  const headers = columns ? columns.map((c) => c.header) : Object.keys(data[0]);

  const keys = columns
    ? columns.map((c) => c.key)
    : (Object.keys(data[0]) as (keyof T)[]);

  // Build CSV content
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map(escapeCSVValue).join(","));

  // Data rows
  for (const row of data) {
    const values = keys.map((key) => {
      const value = row[key];
      return escapeCSVValue(formatCSVValue(value));
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

/**
 * Escape CSV special characters
 */
function escapeCSVValue(value: string): string {
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format value for CSV (handle dates, booleans, nulls, etc.)
 */
function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Download CSV string as a file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV<T extends object>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
): void {
  const csv = objectsToCSV(data, columns);
  downloadCSV(csv, filename);
}
