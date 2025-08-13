"use client";

import AppHeader from "@/components/partials/AppHeader";
import { ThemeProvider } from "@/providers/themes-provider";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";
import "../../globals.css";
import { AppSidebar } from "@/components/partials/AppSidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function HomeroomLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSidebarOpen(window.innerWidth >= 768);
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
              role="homeroom"
              isOpen={isSidebarOpen}
              onToggleSidebar={toggleSidebar}
              isMobile={isMobile}
              onClose={() => setIsSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <AppHeader role="tutor" onMenuClick={toggleSidebar} />
              <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
            </div>
          </div>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
