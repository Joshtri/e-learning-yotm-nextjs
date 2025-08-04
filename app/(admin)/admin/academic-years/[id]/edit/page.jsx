"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import api from "@/lib/axios";

export default function AcademicYearEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [tahunMulai, setTahunMulai] = useState("");
  const [tahunSelesai, setTahunSelesai] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get(`/academic-years/${id}`);
      setTahunMulai(res.data.data.tahunMulai);
      setTahunSelesai(res.data.data.tahunSelesai);
    } catch (error) {
      toast.error("Gagal memuat data tahun ajaran");
    }
  };

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/academic-years/${id}`, {
        tahunMulai,
        tahunSelesai,
      });
      toast.success("Tahun ajaran berhasil diperbarui");
      router.push("/admin/academic-years");
    } catch (error) {
      toast.error("Gagal memperbarui tahun ajaran");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  return (
    <div className="p-6">
      <PageHeader
        title="Edit Tahun Ajaran"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Tahun Ajaran", href: "/admin/academic-years" },
          { label: "Edit Tahun Ajaran" },
        ]}
      />

      <div className="max-w-md mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tahun Mulai</label>
          <Input
            type="number"
            value={tahunMulai}
            onChange={(e) => setTahunMulai(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tahun Selesai</label>
          <Input
            type="number"
            value={tahunSelesai}
            onChange={(e) => setTahunSelesai(e.target.value)}
          />
        </div>

        <Button onClick={handleUpdate} disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
}
