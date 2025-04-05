"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "../../globals.css";
import { useState, useEffect } from "react";
import { TutorSidebar } from "./partials/Sidebar";
import TutorHeader from "./partials/Header";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/themes-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function TutorLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Handle responsive sidebar state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
              <TutorSidebar
                isOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />
            </div>

            {/* Mobile Sidebar with Overlay */}
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
            )}

            {/* Mobile Sidebar */}
            <div className="md:hidden">
              <TutorSidebar
                isOpen={isMobileSidebarOpen}
                onToggleSidebar={() =>
                  setIsMobileSidebarOpen(!isMobileSidebarOpen)
                }
              />
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col">
              <TutorHeader
                onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              />

              {/* Main Content Area */}
              <div className="flex-1">
                <Toaster richColors position="top-right" />
                <main className="p-6">{children}</main>
              </div>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
