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
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        if (data?.user?.role !== "TUTOR") {
          router.replace("/auth/login");
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
        router.replace("/auth/login");
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
