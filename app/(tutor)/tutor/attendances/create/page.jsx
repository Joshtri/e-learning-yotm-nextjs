"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import FormField from "@/components/ui/form-field"; // <- Ini pakai FormField custom kamu
import api from "@/lib/axios";

export default function CreateAttendanceSessionPage() {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      classId: "",
      academicYearId: "",
      tanggal: "",
      keterangan: "",
    },
  });

  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const fetchDropdowns = async () => {
    try {
      const [classesRes, yearsRes] = await Promise.all([
        api.get("/classes?limit=1000"), // ambil semua kelas tutor
        api.get("/academic-years?limit=1000"),   // ambil semua tahun ajaran
      ]);
  
      setClasses(
        Array.isArray(classesRes.data?.data?.classes)
          ? classesRes.data.data.classes
          : []
      );
  
      setAcademicYears(
        Array.isArray(yearsRes.data?.data?.academicYears)
          ? yearsRes.data.data.academicYears
          : []
      );
    } catch (err) {
      console.error("Gagal fetch data dropdown:", err);
      toast.error("Gagal memuat data kelas / tahun ajaran");
    }
  };
  

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post("/tutor/attendances", {
        classId: data.classId,
        academicYearId: data.academicYearId,
        tanggal: data.tanggal,
        keterangan: data.keterangan,
      });

      toast.success("Presensi berhasil dibuat!");
      router.push("/tutor/attendances");
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat presensi");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Presensi"
        description="Form untuk membuat sesi presensi baru."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Presensi Siswa", href: "/tutor/attendances" },
          { label: "Buat Presensi" },
        ]}
      />

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl"
      >
        {/* Pilih Kelas */}
        <FormField
          control={form.control}
          name="classId"
          label="Kelas"
          type="select"
          placeholder="Pilih kelas"
          required
          rules={{ required: "Kelas wajib dipilih" }}
          options={classes.map((kelas) => ({
            value: kelas.id,
            label: `${kelas.namaKelas} - ${kelas.program.namaPaket} (${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai})`,
          }))}
        />

        {/* Pilih Tahun Ajaran */}
        <FormField
          control={form.control}
          name="academicYearId"
          label="Tahun Ajaran"
          type="select"
          placeholder="Pilih tahun ajaran"
          required
          rules={{ required: "Tahun ajaran wajib dipilih" }}
          options={academicYears.map((y) => ({
            value: y.id,
            label: `${y.tahunMulai}/${y.tahunSelesai}`,
          }))}
        />

        {/* Pilih Tanggal */}
        <FormField
          control={form.control}
          name="tanggal"
          label="Tanggal Presensi"
          type="date"
          placeholder="Pilih tanggal presensi"
          required
          rules={{ required: "Tanggal presensi wajib dipilih" }}
        />

        {/* Keterangan */}
        <FormField
          control={form.control}
          name="keterangan"
          label="Keterangan"
          type="text"
          placeholder="Contoh: Pembelajaran IPA"
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan..." : "Buat Presensi"}
        </Button>
      </form>
    </div>
  );
}
