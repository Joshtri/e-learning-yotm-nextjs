"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "../../globals.css";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/partials/AppSidebar"; // ✅ pakai AppSidebar
import AppHeader from "@/components/partials/AppHeader";
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

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
            {/* Sidebar (desktop & mobile) */}
            <AppSidebar
              role="tutor" // ✅ sidebar isi berdasarkan role tutor
              isOpen={isSidebarOpen}
              isMobileOpen={isMobileSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onToggleMobileSidebar={() =>
                setIsMobileSidebarOpen(!isMobileSidebarOpen)
              }
            />

            {/* Main Content */}
            <div className="flex flex-1 flex-col">
              <AppHeader
                role="tutor"
                onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              />

              <div className="flex-1 p-6">{children}</div>
            </div>
          </div>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
