"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getClassById, updateClass } from "@/services/ClassService";
import api from "@/lib/axios";

export default function EditClassPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    classLevel: "",
    classSuffix: "",
    programId: "",
    academicYearId: "",
  });

  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);

  // Ambil data awal
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await getClassById(id);
        if (res?.success) {
          const cls = res.data;
          // Parse namaKelas -> Level + Suffix
          let level = "";
          let suffix = "";
          if (cls?.namaKelas) {
            const parts = cls.namaKelas.trim().split(" ");
            if (parts.length >= 2) {
              suffix = parts.pop();
              level = parts.join(" ");
            } else {
              level = cls.namaKelas;
            }
          }

          setForm({
            classLevel: level,
            classSuffix: suffix,
            programId: cls?.programId ? String(cls.programId) : "",
            academicYearId: cls?.academicYearId
              ? String(cls.academicYearId)
              : "",
          });
        } else {
          toast.error("Kelas tidak ditemukan");
          router.push("/admin/classes");
        }
      } catch {
        toast.error("Gagal mengambil data kelas");
        router.push("/admin/classes");
      }
    };

    fetchData();
    fetchOptions();
  }, [id, router]);

  // Ambil data program, tahun ajaran
  const fetchOptions = async () => {
    try {
      const [prog, years] = await Promise.all([
        api.get("/programs"),
        api.get("/academic-years"),
      ]);

      const programsArr = Array.isArray(prog?.data?.data?.programs)
        ? prog.data.data.programs
        : [];
      const yearsArr = Array.isArray(years?.data?.data?.academicYears)
        ? years.data.data.academicYears
        : [];

      setPrograms(
        programsArr.map((p) => ({
          id: String(p.id),
          label: p.namaPaket ?? p.nama ?? String(p.id),
        })),
      );
      setAcademicYears(
        yearsArr.map((y) => ({
          id: String(y.id),
          label: `${y.tahunMulai}/${y.tahunSelesai} - ${y.semester}`,
          semester: y.semester,
          tahunMulai: y.tahunMulai,
          tahunSelesai: y.tahunSelesai,
          isActive: !!y.isActive,
        })),
      );
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data referensi");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name, value) => {
    // paksa string (atau "none")
    setForm((prev) => ({
      ...prev,
      [name]: value != null ? String(value) : "",
    }));

    // Update selected year untuk menampilkan info
    if (name === "academicYearId" && value) {
      const year = academicYears.find((y) => y.id === String(value));
      setSelectedYear(year);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        namaKelas: `${form.classLevel} ${form.classSuffix}`.trim(),
      };

      const res = await updateClass(id, payload);
      if (res?.success) {
        toast.success("Kelas berhasil diperbarui");
        router.push("/admin/classes");
      } else {
        toast.error(res?.message || "Gagal memperbarui kelas");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus kelas ini?")) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success("Kelas berhasil dihapus");
      router.push("/admin/classes");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus kelas");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6 space-y-6">
          <PageHeader
            title="Edit Kelas"
            description="Perbarui informasi kelas yang terdaftar"
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Kelas", href: "/admin/classes" },
              { label: "Edit Kelas" },
            ]}
            actions={
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Kelas
              </Button>
            }
          />

          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tingkat Kelas
                </label>
                <Select
                  value={form.classLevel}
                  onValueChange={(val) => handleSelect("classLevel", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <SelectItem key={i} value={`Kelas ${i}`}>
                        Kelas {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Nama Kelas (A, B, C...)
                </label>
                <Select
                  value={form.classSuffix}
                  onValueChange={(val) => handleSelect("classSuffix", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nama Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Program</label>
              <Select
                value={form.programId}
                onValueChange={(val) => handleSelect("programId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.length ? (
                    programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Tidak ada data program
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium">
                Tahun Ajaran & Semester
              </label>
              <Select
                value={form.academicYearId}
                onValueChange={(val) => handleSelect("academicYearId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tahun Ajaran & Semester" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.length ? (
                    academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.label}
                        {y.isActive ? " (Aktif)" : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Tidak ada data tahun ajaran
                    </div>
                  )}
                </SelectContent>
              </Select>

              {selectedYear && (
                <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-900">
                    📅 Informasi Tahun Ajaran yang Dipilih:
                  </p>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1">
                    <li>
                      • <span className="font-medium">Tahun:</span>{" "}
                      {selectedYear.tahunMulai}/{selectedYear.tahunSelesai}
                    </li>
                    <li>
                      • <span className="font-medium">Semester:</span>{" "}
                      {selectedYear.semester}
                    </li>
                    <li>
                      • <span className="font-medium">Status:</span>{" "}
                      {selectedYear.isActive ? (
                        <span className="text-green-600 font-semibold">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-gray-600">Tidak Aktif</span>
                      )}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/classes")}
              >
                Batal
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
