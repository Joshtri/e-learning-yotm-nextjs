"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentForm from "@/components/Onboard/FormStudent"; // gunakan default import!
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import api from "@/lib/axios";

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classOptions, setClassOptions] = useState([]);

  useEffect(() => {
    const fetchUserAndClass = async () => {
      try {
        const [meRes, classRes] = await Promise.all([
          fetch("/api/auth/me"),
          api.get("/classes", { params: { onlyActive: true } }),
        ]);

        if (!meRes.ok) throw new Error("Unauthorized");
        const data = await meRes.json();

        if (data?.user?.role !== "STUDENT") {
          router.replace("/");
          return;
        }

        const classes = classRes.data?.data?.classes || [];

        const formattedClasses = classes.map((kelas) => ({
          value: kelas.id,
          label: `${kelas.namaKelas} (${
            kelas.program?.namaPaket || "Tanpa Program"
          }) - ${kelas.academicYear?.tahunMulai}/${
            kelas.academicYear?.tahunSelesai
          }`,
        }));

        setUser(data.user);
        setClassOptions(formattedClasses);
      } catch (error) {
        console.error("Error:", error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndClass();
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
            classOptions={classOptions}
            // classOptions={classOptions}
            onSuccess={() => router.push("/siswa/dashboard")}
          />
        )}
      </div>
    </div>
  );
}
