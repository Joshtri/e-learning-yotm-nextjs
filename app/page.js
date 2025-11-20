"use client";

import { useState, useEffect } from "react";
import { LogIn, EyeOff, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const response = await axios.get("/api/auth/me", {
        timeout: 5000, // 5 second timeout
      });

      const user = response.data.user;

      // If user exists, redirect to their dashboard
      if (user && user.role) {
        const dashboardMap = {
          ADMIN: "/admin/dashboard",
          TUTOR: "/tutor/dashboard",
          STUDENT: "/siswa/dashboard",
        };

        const dashboard = dashboardMap[user.role] || "/";
        router.push(dashboard);
      } else {
        // No user, show login page
        setIsCheckingAuth(false);
      }
    } catch (error) {
      // Error or timeout, show login page
      console.error("Auth check error:", error);
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailError("");
    setPasswordError("");

    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password,
      });

      toast.success("Berhasil login");
      const role = res.data.user.role;

      // Redirect berdasarkan role
      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (role === "TUTOR") {
        router.push("/tutor/dashboard");
      } else if (role === "STUDENT") {
        router.push("/siswa/dashboard");
      } else {
        toast.error("Role tidak dikenali");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || "Terjadi kesalahan saat login";
        toast.error(errorMessage);
        // Simple error mapping
        if (errorMessage.toLowerCase().includes("email")) {
          setEmailError(errorMessage);
        } else if (errorMessage.toLowerCase().includes("password")) {
          setPasswordError(errorMessage);
        } else {
          setEmailError(errorMessage);
        }
      } else {
        toast.error("Terjadi kesalahan saat login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/bg-yotm.png')" }} // ganti sesuai path file kamu
    >
      {/* Overlay for subtle dark effect */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0"></div>

      {/* Content (login card) */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md shadow-xl bg-white/70 backdrop-blur-md transition-all duration-500 animate-fade-in rounded-xl">
          <CardHeader className="space-y-4 items-center text-center">
            <div className="flex justify-center items-center">
              <Image
                src="/android-chrome-192x192.png"
                alt="Yayasan Obor Timor Logo"
                width={80}
                height={80}
                quality={100}
                priority
                className="rounded-full"
              />
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-primary">
                Halo, Selamat Datang!
              </h1>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Yayasan Obor Timor Ministry
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 leading-relaxed">
                Masuk ke akun e-learning Anda untuk mulai belajar, mengerjakan
                tugas, dan berinteraksi dengan pengajar.
              </CardDescription>
              <p className="text-sm font-medium text-primary">
                Belajar jadi lebih mudah dan fleksibel!
              </p>
            </div>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {emailError && (
                  <p className="text-sm text-red-600 mt-1">{emailError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button
                type="submit"
                className="w-full mt-7"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Masuk
                  </>
                )}
              </Button>
              <p className="mt-4 text-sm text-center text-muted-foreground">
                Lupa password? Hubungi administrator
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
