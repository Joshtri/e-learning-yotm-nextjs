"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

/* eslint-disable react/prop-types */
export function PDFViewerDialog({
  children,
  pdfData,
  title = "Lihat PDF",
  downloadFileName = "document.pdf",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Create blob URL from base64 data
  const createPdfUrl = () => {
    try {
      if (!pdfData) return null;

      // Check if it's already a blob URL
      if (pdfData.startsWith("blob:")) {
        return pdfData;
      }

      // Handle base64 data
      let base64Data = pdfData;
      if (pdfData.startsWith("data:application/pdf;base64,")) {
        base64Data = pdfData.split(",")[1];
      }

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  };

  // Create PDF URL when dialog opens
  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open && pdfData && !pdfUrl) {
      const url = createPdfUrl();
      setPdfUrl(url);
    }
    if (!open && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const handleDownload = () => {
    try {
      if (!pdfData) return;

      let base64Data = pdfData;
      if (pdfData.startsWith("data:application/pdf;base64,")) {
        base64Data = pdfData.split(",")[1];
      }

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Handle error silently
    }
  };

  const handleViewPDF = () => {
    try {
      if (!pdfData) return;

      const url = pdfUrl || createPdfUrl();
      if (!url) {
        return;
      }

      // Open PDF in new tab with proper handling
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 0; 
                  font-family: Arial, sans-serif;
                }
                .container {
                  width: 100vw;
                  height: 100vh;
                  display: flex;
                  flex-direction: column;
                }
                .header {
                  background: #f5f5f5;
                  padding: 10px 20px;
                  border-bottom: 1px solid #ddd;
                  display: flex;
                  justify-content: between;
                  align-items: center;
                }
                iframe { 
                  flex: 1;
                  width: 100%; 
                  border: none; 
                }
                .error {
                  padding: 20px;
                  text-align: center;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h3 style="margin: 0;">${title}</h3>
                </div>
                <iframe src="${url}" type="application/pdf">
                  <div class="error">
                    <p>Browser Anda tidak mendukung tampilan PDF. <a href="${url}" download="${downloadFileName}">Klik di sini untuk mengunduh</a></p>
                  </div>
                </iframe>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch {
      // Fallback to download
      handleDownload();
    }
  };

  if (!pdfData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Unduh
              </Button>
              <Button size="sm" variant="outline" onClick={handleViewPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Buka di Tab Baru
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden min-h-[80vh]">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0 min-h-[75vh]"
              title={title}
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[75vh]">
              <p className="text-muted-foreground">Memuat PDF...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PDFViewerButton({
  pdfData,
  title = "Lihat PDF",
  downloadFileName = "document.pdf",
  variant = "outline",
  size = "sm",
  className = "",
  buttonLabel = "Lihat Soal",
}) {
  return (
    <PDFViewerDialog
      pdfData={pdfData}
      title={title}
      downloadFileName={downloadFileName}
    >
      <Button variant={variant} size={size} className={className}>
        <FileText className="w-4 h-4 mr-2" />
        {buttonLabel}
      </Button>
    </PDFViewerDialog>
  );
}
/* eslint-enable react/prop-types */
