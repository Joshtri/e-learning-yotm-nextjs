"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import FormField from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function ClassCreatePage() {
  const router = useRouter();
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);

  const form = useForm({
    defaultValues: {
      classLevel: "",
      classSuffix: "",
      programId: "",
      academicYearId: "",
    },
  });

  // Watch academicYearId untuk menampilkan info semester
  const watchAcademicYearId = form.watch("academicYearId");

  useEffect(() => {
    if (watchAcademicYearId && academicYears.length > 0) {
      const year = academicYears.find((y) => y.id === watchAcademicYearId);
      setSelectedYear(year);
    } else {
      setSelectedYear(null);
    }
  }, [watchAcademicYearId, academicYears]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const [programRes, yearRes] = await Promise.all([
          api.get("/programs"),
          api.get("/academic-years"),
        ]);
        setPrograms(programRes.data?.data?.programs || []);
        setAcademicYears(yearRes.data?.data?.academicYears || []);
      } catch {
        toast.error("Gagal memuat data program/tahun ajaran");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const onInvalid = (errors) => {
    console.log("Validation errors:", errors);
    toast.error(
      "Harap lengkapi semua field yang wajib diisi (bertanda merah).",
    );
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      // ... (rest of onSubmit)
      const payload = {
        namaKelas: `${data.classLevel} ${data.classSuffix}`.trim(),
        programId: data.programId,
        academicYearId: data.academicYearId,
      };

      const res = await api.post("/classes", payload);

      if (res.data.success) {
        toast.success("Kelas berhasil ditambahkan");
        router.push("/admin/classes");
      } else {
        throw new Error(res.data.message || "Gagal menambahkan kelas");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p>Memuat data program dan tahun ajaran...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tambah Kelas Baru"
        description="Isi informasi kelas yang ingin ditambahkan"
        backButton={{
          href: "/admin/classes",
          label: "Kembali ke daftar kelas",
        }}
        breadcrumbs={[
          { label: "Kelas", href: "/admin/classes" },
          { label: "Tambah Kelas" },
        ]}
      />

      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Data Kelas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="classLevel"
                label="Tingkat Kelas"
                type="select"
                placeholder="Pilih tingkat"
                required
                rules={{ required: "Tingkat kelas wajib dipilih" }}
                options={[
                  { value: "Kelas 6", label: "Kelas 6" },
                  { value: "Kelas 7", label: "Kelas 7" },
                  { value: "Kelas 8", label: "Kelas 8" },
                  { value: "Kelas 9", label: "Kelas 9" },
                  { value: "Kelas 10", label: "Kelas 10" },
                  { value: "Kelas 11", label: "Kelas 11" },
                  { value: "Kelas 12", label: "Kelas 12" },
                ]}
              />

              <FormField
                control={form.control}
                name="classSuffix"
                label="Nama Kelas"
                type="select"
                placeholder="Pilih kelas (A, B, C...)"
                required
                rules={{ required: "Nama kelas wajib dipilih" }}
                options={[
                  { value: "A", label: "A" },
                  { value: "B", label: "B" },
                  { value: "C", label: "C" },
                  { value: "D", label: "D" },
                  { value: "E", label: "E" },
                  { value: "F", label: "F" },
                  { value: "G", label: "G" },
                  { value: "H", label: "H" },
                  { value: "I", label: "I" },
                  { value: "J", label: "J" },
                  { value: "K", label: "K" },
                  { value: "L", label: "L" },
                  { value: "M", label: "M" },
                  { value: "N", label: "N" },
                  { value: "O", label: "O" },
                  { value: "P", label: "P" },
                  { value: "Q", label: "Q" },
                  { value: "R", label: "R" },
                  { value: "S", label: "S" },
                  { value: "T", label: "T" },
                  { value: "U", label: "U" },
                  { value: "V", label: "V" },
                  { value: "W", label: "W" },
                  { value: "X", label: "X" },
                  { value: "Y", label: "Y" },
                  { value: "Z", label: "Z" },
                ]}
              />
            </div>

            <FormField
              control={form.control}
              name="programId"
              label="Program / Paket"
              type="select"
              placeholder="Pilih program"
              required
              rules={{ required: "Program wajib dipilih" }}
              options={programs.map((p) => ({
                value: p.id,
                label: p.namaPaket,
              }))}
            />

            <FormField
              control={form.control}
              name="academicYearId"
              label="Tahun Ajaran & Semester"
              type="select"
              placeholder="Pilih tahun ajaran dan semester"
              required
              rules={{ required: "Tahun ajaran wajib dipilih" }}
              options={academicYears.map((y) => ({
                value: y.id,
                label: `${y.tahunMulai}/${y.tahunSelesai} - ${y.semester}${y.isActive ? " (Aktif)" : ""}`,
              }))}
            />

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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/classes")}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Kelas
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
