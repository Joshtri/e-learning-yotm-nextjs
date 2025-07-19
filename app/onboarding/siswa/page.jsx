"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import  StudentForm  from "@/components/Onboard/FormStudent";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        if (data?.user?.role !== "STUDENT") {
          router.replace("/");
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) return <FullScreenLoader label="Menyiapkan halaman..." />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold text-center mb-4">
          Lengkapi Profil Siswa
        </h1>
        <p className="text-center text-sm text-gray-600 mb-6">
          Kami membutuhkan informasi Anda sebelum Anda dapat mengakses platform.
        </p>

        {user && (
          <StudentForm
            userId={user.id}
            onSuccess={() => router.push("/siswa/dashboard")}
          />
        )}
      </div>
    </div>
  );
}
