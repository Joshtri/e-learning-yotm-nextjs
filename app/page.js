"use client";

import React, { useState } from "react";
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

  const router = useRouter();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 items-center text-center">
          <div className="flex justify-center items-center">
            <Image
              src="/yotm_logo.png"
              alt="Yayasan Obor Timor Logo"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Yayasan Obor Timor
          </CardTitle>
          <CardDescription>
            Masuk ke platform pembelajaran digital Yayasan Obor Timor Ministry
          </CardDescription>
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
            <Button type="submit" className="w-full mt-7" disabled={isLoading}>
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
  );
}
