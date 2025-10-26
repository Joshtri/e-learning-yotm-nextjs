"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "../../globals.css";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/partials/AppSidebar"; // ✅ pakai AppSidebar
import AppHeader from "@/components/partials/AppHeader";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/themes-provider";
import AuthGuard from "@/components/auth/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function TutorLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobile, isSidebarOpen]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthGuard allowedRoles={["TUTOR"]}>
          {/* <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          > */}
          <div className="flex min-h-screen bg-background">
            {/* Sidebar (desktop & mobile) */}
            <AppSidebar
              role="tutor"
              isOpen={isSidebarOpen}
              isMobile={isMobile}
              onToggleSidebar={toggleSidebar}
              onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <AppHeader role="tutor" onMenuClick={toggleSidebar} />
              <div className="flex-1 overflow-auto p-4 md:p-6 mt-10 pt-20">{children}</div>
            </div>
          </div>
          <Toaster richColors position="top-right" />
          {/* </ThemeProvider> */}
        </AuthGuard>
      </body>
    </html>
  );
}
