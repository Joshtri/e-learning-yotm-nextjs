"use client"


import { Geist, Geist_Mono } from "next/font/google";
import "../../globals.css";
import AdminHeader from "./partials/Header";
import { useState } from "react";
import { AdminSidebar } from "./partials/Sidebar";
import { Menu, X } from "lucide-react";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
 

export default function AdminLayout({children}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default terbuka di desktop
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Khusus mobile
  return (
    <>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <div className="flex min-h-screen bg-background">
          {/* Sidebar - Bisa ditutup/dibuka di desktop */}
          <div
            className={`bg-white shadow-lg transition-all duration-300 ${
              isSidebarOpen ? "w-64" : "w-16"
            } hidden md:flex flex-col`}
          >

            <AdminSidebar isOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          </div>

          {/* Sidebar di Mobile */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            ></div>
          )}

          <div
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg ${
              isMobileSidebarOpen ? "block" : "hidden"
            } md:hidden`}
          >
            <AdminSidebar isOpen={isMobileSidebarOpen} />
          </div>

          {/* Main content + Header */}
          <div className="flex flex-1 flex-col">
            {/* Header dengan tombol toggle di mobile */}
            <div className="flex items-center justify-end border-b">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="p-2 md:hidden"
              >
                {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <AdminHeader onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
            </div>

            {/* Main Content */}
            <Toaster richColors  position="top-right"/>
            <main className="p-6">{children}</main>
          </div>
        </div>
        </body>
      </html>
    </>
  );
}
