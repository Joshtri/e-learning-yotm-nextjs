"use client";

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
import { Input } from "@/components/ui/input";
import { Bell, Menu, Search, Moon, Sun } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect } from "react";
import { NotificationDropdown } from "../ui/notification-dropdown";

export default function AppHeader({ onMenuClick, role }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
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
  // const displayName = role?.charAt(0).toUpperCase() + role?.slice(1) || "User";
  const displayName = user?.nama || "User";

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <div className="hidden md:block w-[300px] lg:w-[400px]">
          <form>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari..."
                className="w-full bg-background pl-9"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-4 pr-1">
        <Button variant="ghost" size="icon" className="hidden md:flex relative">
          {/* <Bell className="h-5 w-5" /> */}
          <span className="sr-only">Notifikasi</span>
          {/* <NotificationDropdown userId={user.id} /> */}
          {user && <NotificationDropdown userId={user.id} />}

          {/* <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary"></span> */}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle Dark Mode</span>
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt={displayName} />
                <AvatarFallback>
                  {user?.nama?.charAt(0).toUpperCase() || avatarFallback}
                </AvatarFallback>{" "}
              </Avatar>
              {/* <span className="hidden md:inline">
                {mode === "homeroom" ? "Wali Kelas" : user?.nama}
              </span> */}
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
