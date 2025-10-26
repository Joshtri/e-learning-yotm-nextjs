"use client";

import AppHeader from "@/components/partials/AppHeader";
import { ThemeProvider } from "@/providers/themes-provider";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";
import "../../globals.css";
import { AppSidebar } from "@/components/partials/AppSidebar";
import AuthGuard from "@/components/auth/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function AdminLayout({ children }) {
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
        <AuthGuard allowedRoles={["ADMIN"]}>
          {/* <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          > */}
            <div className="flex min-h-screen bg-background">
              {/* Sidebar */}
              <AppSidebar
                role="admin"
                isOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
                isMobile={isMobile}
                onClose={() => setIsSidebarOpen(false)}
              />

              {/* Right Content */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <AppHeader role="admin" onMenuClick={toggleSidebar} />

                {/* Scrollable content with padding-top for fixed header */}
                <main className="flex-1 overflow-auto p-4 md:p-6 mt-10 pt-20">
                  {children}
                </main>
              </div>
            </div>
          {/* </ThemeProvider> */}
        </AuthGuard>
      </body>
    </html>
  );
}
