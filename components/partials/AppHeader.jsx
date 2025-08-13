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
import { Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { NotificationDropdown } from "../ui/notification-dropdown";

export default function AppHeader({ onMenuClick, role }) {
  const router = useRouter();
  const [mode, setMode] = useState("default");
  const [user, setUser] = useState(null);

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
    if (mode === "default") {
      localStorage.setItem("mode", "homeroom");
      setMode("homeroom");
      toast.success("Berpindah ke Mode Wali Kelas");
      router.push("/homeroom/dashboard");
    } else {
      localStorage.setItem("mode", "default");
      setMode("default");
      toast.success("Berpindah ke Mode Tutor");
      router.push("/tutor/dashboard");
    }
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

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-blue-300 bg-gradient-to-r from-blue-500 to-blue-600 px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden hover:bg-blue-400 text-white"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        {/* ✅ GANTI DENGAN WIDGET */}
        <div className="hidden md:block">
          <HeaderDateTimeWidget />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-4 pr-1">
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex relative hover:bg-blue-400 text-white"
        >
          <span className="sr-only">Notifikasi</span>
          {user && <NotificationDropdown userId={user.id} />}
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
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
            {role === "tutor" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSwitchMode}>
                  {mode === "homeroom"
                    ? "Switch ke Mode Tutor"
                    : "Switch ke Mode Wali Kelas"}
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
    </header>
  );
}
