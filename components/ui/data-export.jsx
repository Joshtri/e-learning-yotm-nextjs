"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DataExport({
  data,
  filename = "export.csv",
  label = "Export",
  fields = null, // Optional specific fields to export
}) {
  const handleExport = () => {
    if (!data.length) return

    // Get headers from first object or use provided fields
    const headers = fields || Object.keys(data[0])

    // Create CSV content
    const csvContent = [
      headers.join(","), // Header row
      ...data.map((row) =>
        headers
          .map((header) => {
            // Handle values that might contain commas
            const value = row[header]
            const stringValue = value === null || value === undefined ? "" : String(value)

            // Escape quotes and wrap in quotes if contains comma
            const escaped = stringValue.replace(/"/g, '""')
            return stringValue.includes(",") ? `"${escaped}"` : escaped
          })
          .join(","),
      ),
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}

