"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

/**
 * AuthGuard Component
 * Melindungi halaman dari akses yang tidak sah
 * - Redirect ke login jika tidak terautentikasi
 * - Redirect ke dashboard yang sesuai jika role tidak cocok
 *
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Array role yang diizinkan mengakses halaman
 * @param {React.ReactNode} props.children - Konten yang akan ditampilkan jika authorized
 * @param {React.ReactNode} props.loadingComponent - Optional loading component
 */
export default function AuthGuard({
  allowedRoles = [],
  children,
  loadingComponent = <LoadingScreen />
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Call /api/auth/me to verify token and get user info
      const response = await axios.get("/api/auth/me", {
        timeout: 5000, // 5 second timeout
      });

      const user = response.data.user;

      // If no user, redirect to login
      if (!user || !user.role) {
        router.push("/");
        return;
      }

      // Check if user role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Role tidak sesuai, redirect ke dashboard yang benar
        redirectToDashboard(user.role);
        return;
      }

      // User authorized
      setIsAuthorized(true);
      setIsLoading(false);

    } catch (error) {
      // Token invalid, expired, atau tidak ada
      // Redirect ke login
      console.error("Auth check error:", error);
      router.push("/");
    }
  };

  const redirectToDashboard = (role) => {
    const dashboardMap = {
      ADMIN: "/admin/dashboard",
      TUTOR: "/tutor/dashboard",
      STUDENT: "/siswa/dashboard",
    };

    const correctDashboard = dashboardMap[role] || "/";
    router.push(correctDashboard);
  };

  if (isLoading) {
    return loadingComponent;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

// Default loading screen
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-gray-600">Memverifikasi akses...</p>
      </div>
    </div>
  );
}
