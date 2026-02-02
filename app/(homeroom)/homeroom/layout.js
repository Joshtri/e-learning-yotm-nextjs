"use client";

import AppHeader from "@/components/partials/AppHeader";
import { ThemeProvider } from "@/providers/themes-provider";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";
import "../../globals.css";
import { AppSidebar } from "@/components/partials/AppSidebar";
import AuthGuard from "@/components/auth/AuthGuard";

import { useRouter } from "next/navigation";
import api from "@/lib/axios";

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
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        await api.get("/homeroom/dashboard/overview");
      } catch (error) {
        // Jika gagal (misal 404 karena tidak punya kelas), redirect ke dashboard tutor
        router.replace("/tutor/dashboard");
      }
    };
    checkAccess();
  }, []);

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
            <AppSidebar
              role="homeroom"
              isOpen={isSidebarOpen}
              onToggleSidebar={toggleSidebar}
              isMobile={isMobile}
              onClose={() => setIsSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <AppHeader role="tutor" onMenuClick={toggleSidebar} />
              <div className="flex-1 overflow-auto p-4 md:p-6 mt-10 pt-20">{children}</div>
            </div>
          </div>
          {/* </ThemeProvider> */}
        </AuthGuard>
      </body>
    </html>
  );
}
