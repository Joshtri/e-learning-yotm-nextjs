"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormTutor } from "@/components/Onboard/FormTutor";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

export default function OnboardingTutorPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store"
        });
        
        // Handle 401 responses by redirecting to login
        if (res.status === 401) {
          router.replace("/");
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        // If no user data, redirect to login
        if (!data.user) {
          router.replace("/");
          return;
        }
        
        // If user is not a tutor, redirect to appropriate dashboard
        if (data.user.role !== "TUTOR") {
          router.replace(`/${data.user.role.toLowerCase()}/dashboard`);
          return;
        }
        
        setUser(data.user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) return <FullScreenLoader label="Memuat halaman..." />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold text-center mb-4">
          Lengkapi Profil Tutor
        </h1>
        <p className="text-center text-sm text-gray-600 mb-6">
          Kami membutuhkan data Anda sebelum Anda dapat menggunakan platform ini.
        </p>

        {user && (
          <FormTutor
            userId={user.id}
            onSuccess={() => router.push("/tutor/dashboard")}
          />
        )}
      </div>
    </div>
  );
}
