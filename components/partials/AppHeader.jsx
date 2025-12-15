"use client";

import HeaderDateTimeWidget from "@/components/HeaderDateTimeWidget";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import { ArrowUp, Loader2, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { NotificationDropdown } from "../ui/notification-dropdown";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import useScrollTop from "@/hooks/useScrollTop";
import { CommandMenu } from "@/components/command-menu";

export default function AppHeader({ onMenuClick, role }) {
  const router = useRouter();
  const [mode, setMode] = useState("default");
  const [user, setUser] = useState(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Show scroll button after scrolling 200px
  const scrolled = useScrollTop(200);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("mode") || "default";
      setMode(storedMode);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Gagal mengambil data user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleSwitchMode = () => {
    // Close dropdown immediately
    setIsDropdownOpen(false);
    setShowSwitchConfirm(false);
    setIsSwitching(true);

    // Small delay to ensure dropdown closes
    setTimeout(() => {
      try {
        if (mode === "default") {
          localStorage.setItem("mode", "homeroom");
          setMode("homeroom");
          toast.success("Berpindah ke Mode Wali Kelas");
          router.replace("/homeroom/dashboard");
        } else {
          localStorage.setItem("mode", "default");
          setMode("default");
          toast.success("Berpindah ke Mode Tutor");
          router.replace("/tutor/dashboard");
        }
      } catch (error) {
        console.error("Error switching mode:", error);
        toast.error("Gagal berpindah mode");
        setIsSwitching(false);
      }
    }, 100);
  };

  const handleSwitchModeClick = () => {
    // Close dropdown first
    setIsDropdownOpen(false);

    // Wait for dropdown to close, then show confirmation
    setTimeout(() => {
      setShowSwitchConfirm(true);
    }, 150);
  };

  const getRolePrefix = () => {
    if (role === "admin") return "/admin";
    if (role === "student") return "/siswa";
    if (role === "tutor") {
      return mode === "homeroom" ? "/homeroom" : "/tutor";
    }
    return "/";
  };

  const rolePrefix = getRolePrefix();

  const avatarFallback =
    role === "student" ? "SI" : role === "tutor" ? "TR" : "AD";
  const displayName = user?.nama || "User";

  // Check if tutor is a homeroom teacher
  const isHomeroomTeacher =
    role === "tutor" &&
    user?.tutor?.homeroomClasses &&
    user.tutor.homeroomClasses.length > 0;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[200] flex h-16 items-center justify-between border-b border-blue-300 bg-gradient-to-r from-blue-500 to-blue-600 px-4 md:px-6 shadow-md">
        {/* Left */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden hover:bg-blue-400/50 text-white transition-colors"
            aria-label="Toggle Menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        {/* Center Title */}
        <div className="flex-1 px-4 hidden md:flex justify-center items-center">
          <h1 className="font-bold text-lg text-white tracking-wide">
            E-Learning App
          </h1>
        </div>
          {/* Desktop Date/Time Widget */}
          <div className="hidden md:block">
            <HeaderDateTimeWidget />
          </div>
        </div>



        {/* Right */}
        <div className="flex items-center gap-2 md:gap-4 pr-1">
          {/* Command Menu */}
          <div className="hidden md:block">
            <CommandMenu role={role} />
          </div>
          <div className="hidden md:flex relative">
            <span className="sr-only">Notifikasi</span>
            {user && <NotificationDropdown userId={user.id} />}
          </div>

          {/* User dropdown */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2 hover:bg-blue-400"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt={displayName} />
                  <AvatarFallback className="bg-blue-700 text-white">
                    {user?.nama?.charAt(0).toUpperCase() || avatarFallback}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`${rolePrefix}/my-profile`}
                  className="w-full cursor-pointer"
                >
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`${rolePrefix}/log-activity`}
                  className="w-full cursor-pointer"
                >
                  Log Aktivitas
                </Link>
              </DropdownMenuItem>
              {isHomeroomTeacher && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSwitchModeClick}
                    disabled={isSwitching}
                    className="cursor-pointer"
                  >
                    {isSwitching ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Switching...</span>
                      </div>
                    ) : (
                      <span>
                        {mode === "homeroom"
                          ? "Switch ke Mode Tutor"
                          : "Switch ke Mode Wali Kelas"}
                      </span>
                    )}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await axios.post("/api/auth/logout");
                    toast.success("Berhasil logout!");
                    router.push("/");
                  } catch {
                    toast.error("Gagal logout");
                  }
                }}
                className="w-full cursor-pointer text-red-500 focus:text-red-500"
              >
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          open={showSwitchConfirm}
          onOpenChange={setShowSwitchConfirm}
          title="Konfirmasi Perpindahan Mode"
          description={`Anda akan berpindah ke ${
            mode === "homeroom" ? "Mode Tutor" : "Mode Wali Kelas"
          }. Halaman akan dialihkan ke dashboard yang sesuai. Apakah Anda yakin?`}
          confirmText="Ya, Pindah Mode"
          cancelText="Batal"
          onConfirm={handleSwitchMode}
          isLoading={isSwitching}
        />
      </header>

      {/* Floating Scroll to Top Button - Fixed position */}
      {scrolled && (
        <Button
          variant="default"
          size="icon"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-[100] h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 md:bottom-8 md:right-8"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </>
  );
}
