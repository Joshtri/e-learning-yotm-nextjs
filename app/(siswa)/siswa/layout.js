"use client";

import React, { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "../../globals.css";
import { StudentSidebar } from "./partials/Sidebar";
import StudentHeader from "./partials/Header";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
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
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
              <StudentSidebar
                isOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
            )}

            {/* Mobile Sidebar */}
            <div className="md:hidden">
              <StudentSidebar
                isOpen={isMobileSidebarOpen}
                onToggleSidebar={() =>
                  setIsMobileSidebarOpen(!isMobileSidebarOpen)
                }
              />
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col">
              <StudentHeader
                onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              />
              <main className="flex-1 p-6">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
