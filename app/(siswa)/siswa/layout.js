"use client";

import { useEffect, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "../../globals.css";
import AppHeader from "@/components/partials/AppHeader";
import { AppSidebar } from "@/components/partials/AppSidebar";
import { ThemeProvider } from "@/providers/themes-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function StudentLayout({ children }) {
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

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        > */}
          <div className="flex min-h-screen bg-background">
            <AppSidebar
              role="student"
              isOpen={isSidebarOpen}
              isMobile={isMobile}
              onToggleSidebar={toggleSidebar}
              onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
              <AppHeader role="student" onMenuClick={toggleSidebar} />
              <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
            </div>
          </div>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
