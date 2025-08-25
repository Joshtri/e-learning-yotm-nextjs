"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";

/* eslint-disable react/prop-types */
export function EnhancedPDFViewer({
  children,
  pdfData,
  title = "Lihat PDF",
  downloadFileName = "document.pdf",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clean up URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Create blob URL from base64 data with better error handling
  const createPdfUrl = async () => {
    try {
      if (!pdfData) {
        throw new Error("No PDF data provided");
      }

      setIsLoading(true);
      setError(null);

      // Handle different base64 formats
      let base64Data = pdfData;

      // Remove data URL prefix if present
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }

      // Validate base64
      if (!base64Data || base64Data.length === 0) {
        throw new Error("Invalid PDF data");
      }

      // Convert base64 to blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/pdf" });

      // Verify blob size
      if (blob.size === 0) {
        throw new Error("Generated PDF blob is empty");
      }

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setIsLoading(false);

      return url;
    } catch (err) {
      setError(err.message || "Failed to load PDF");
      setIsLoading(false);
      return null;
    }
  };

  // Handle dialog open/close
  const handleOpenChange = (open) => {
    setIsOpen(open);

    if (open && pdfData && !pdfUrl) {
      createPdfUrl();
    }

    if (!open && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setError(null);
    }
  };

  // Download PDF
  const handleDownload = async () => {
    try {
      if (!pdfData) return;

      let base64Data = pdfData;
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError("Failed to download PDF");
    }
  };

  // Open in new tab
  const handleOpenInNewTab = () => {
    if (!pdfUrl) return;

    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      setError("Failed to open new window. Please check popup blocker.");
      return;
    }

    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f5f5f5;
            }
            .header {
              background: white;
              padding: 12px 20px;
              border-bottom: 1px solid #e5e5e5;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .header h1 {
              font-size: 18px;
              font-weight: 600;
              color: #333;
            }
            .pdf-container {
              height: calc(100vh - 60px);
              background: #525659;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
              min-height: 100vh;
            }
            .error {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              background: white;
              color: #666;
              text-align: center;
              padding: 20px;
            }
            .error a {
              color: #2563eb;
              text-decoration: none;
              margin-left: 8px;
            }
            .error a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="pdf-container">
            <iframe src="${pdfUrl}" type="application/pdf" title="${title}">
              <div class="error">
                <div>
                  <p>Browser Anda tidak mendukung tampilan PDF.</p>
                  <a href="${pdfUrl}" download="${downloadFileName}">Klik di sini untuk mengunduh PDF</a>
                </div>
              </div>
            </iframe>
          </div>
        </body>
      </html>
    `);

    newWindow.document.close();
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
            <DialogTitle className="text-lg">{title}</DialogTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Unduh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenInNewTab}
                disabled={!pdfUrl || isLoading}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Buka di Tab Baru
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-lg border bg-muted/50 min-h-[80vh]">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Memuat PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 p-8">
                <div className="text-red-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Gagal memuat PDF</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Coba Unduh PDF
                </Button>
              </div>
            </div>
          )}

          {pdfUrl && !isLoading && !error && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0 bg-white min-h-[75vh]"
              title={title}
              onError={() => setError("Failed to display PDF in browser")}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
/* eslint-enable react/prop-types */
