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

export default function AppHeader({ onMenuClick, role }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      toast.success("Berhasil logout!");
      router.push("/");
    } catch (error) {
      toast.error("Gagal logout");
    }
  };

  const getRolePrefix = () => {
    if (role === "admin") return "/admin";
    if (role === "student") return "/siswa";
    if (role === "tutor") return "/tutor";
    return "/";
  };

  const rolePrefix = getRolePrefix();
  const avatarFallback =
    role === "student" ? "SI" : role === "tutor" ? "TR" : "AD";
  const displayName = role?.charAt(0).toUpperCase() + role?.slice(1) || "User";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* Kiri - tombol menu & search */}
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

      {/* Kanan - kontrol user */}
      <div className="flex items-center gap-2 md:gap-4 pr-1">
        <Button variant="ghost" size="icon" className="relative hidden md:flex">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifikasi</span>
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary"></span>
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt={displayName} />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline">{displayName}</span>
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
                Log Activity
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
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
