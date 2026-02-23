"use client";

import AppHeader from "@/components/partials/AppHeader";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";
import "../../globals.css";
import { AppSidebar } from "@/components/partials/AppSidebar";
import AuthGuard from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

import { HomeroomClassProvider, useHomeroomClass } from "@/context/HomeroomClassContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ── Komponen dialog pemilihan kelas ──────────────────────────────────────────
// Hanya muncul jika wali kelas punya >1 kelas dan belum ada pilihan
function ClassSelectionDialog() {
  const { classes, needsSelection, selectClass, isLoading } = useHomeroomClass();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (needsSelection) setOpen(true);
  }, [needsSelection]);

  const handleSelect = (classId) => {
    selectClass(classId);
    setOpen(false);
  };

  if (isLoading || !needsSelection) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent
        // Tidak bisa ditutup dengan klik luar atau tombol X
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-md"
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <DialogTitle>Pilih Kelas yang Dikelola</DialogTitle>
          </div>
          <DialogDescription>
            Anda terdaftar sebagai wali kelas di lebih dari satu kelas. Pilih
            kelas yang ingin Anda kelola sekarang. Anda dapat menggantinya
            kapan saja melalui header.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {classes.map((kelas) => (
            <Button
              key={kelas.id}
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4"
              onClick={() => handleSelect(kelas.id)}
            >
              <div className="text-left">
                <p className="font-semibold">{kelas.namaKelas}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {kelas.program?.namaPaket || "-"} &middot;{" "}
                  {kelas.academicYear
                    ? `${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai} ${kelas.academicYear.semester}`
                    : "-"}{" "}
                  &middot; {kelas._count?.students ?? 0} siswa
                </p>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Layout utama ──────────────────────────────────────────────────────────────
export default function HomeroomLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        await api.get("/homeroom/dashboard/overview");
      } catch {
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthGuard allowedRoles={["TUTOR"]}>
          <HomeroomClassProvider>
            <div className="flex min-h-screen bg-background">
              <AppSidebar
                role="homeroom"
                isOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
                isMobile={isMobile}
                onClose={() => setIsSidebarOpen(false)}
              />
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header dapat membaca HomeroomClassContext karena berada dalam provider */}
                <AppHeader role="tutor" onMenuClick={toggleSidebar} />
                <div className="flex-1 overflow-auto p-4 md:p-6 mt-10 pt-20">
                  {children}
                </div>
              </div>
            </div>

            {/* Dialog wajib — muncul di atas semua konten jika belum pilih kelas */}
            <ClassSelectionDialog />
          </HomeroomClassProvider>
        </AuthGuard>
      </body>
    </html>
  );
}
