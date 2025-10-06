"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import api from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEMESTERS } from "@/constants/common";

export default function AcademicYearEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [tahunMulai, setTahunMulai] = useState("");
  const [tahunSelesai, setTahunSelesai] = useState("");
  const [semester, setSemester] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get(`/academic-years/${id}`);
      setTahunMulai(res.data.data.tahunMulai);
      setTahunSelesai(res.data.data.tahunSelesai);
      setSemester(res.data.data.semester);
    } catch (error) {
      toast.error("Gagal memuat data tahun ajaran");
    }
  };

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/academic-years/${id}`, {
        tahunMulai: Number(tahunMulai),
        tahunSelesai: Number(tahunSelesai),
        semester,
      });
      toast.success("Tahun ajaran berhasil diperbarui");
      router.push("/admin/academic-years");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Gagal memperbarui tahun ajaran";
      toast.error(errorMessage);
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
            placeholder="Contoh: 2023"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tahun Selesai</label>
          <Input
            type="number"
            value={tahunSelesai}
            onChange={(e) => setTahunSelesai(e.target.value)}
            placeholder="Contoh: 2024"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Semester</label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Semester" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(SEMESTERS).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleUpdate} disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
}
