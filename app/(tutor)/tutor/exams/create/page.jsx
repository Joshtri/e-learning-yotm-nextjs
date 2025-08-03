"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";

const JENIS_UJIAN_OPTIONS = [
  { label: "Ujian Harian", value: "DAILY_TEST" },
  { label: "Ujian Awal Semester", value: "START_SEMESTER_TEST" },
  { label: "UTS (Ujian Tengah Semester)", value: "MIDTERM" },
  { label: "UAS (Ujian Akhir Semester)", value: "FINAL_EXAM" },
];

export default function ExamCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      durasiMenit: 60,
      nilaiMaksimal: 100,
      acakSoal: false,
      acakJawaban: false,
    },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await api.get("/tutor/my-class-subjects");
        const items = res.data.data;

        // ✅ Sesuaikan: akses tahun ajaran aktif dari item.class.academicYear
        const filtered = items.filter(
          (item) => item.class?.academicYear?.isActive
        );

        const mapped = filtered.map((item) => ({
          id: item.id,
          label: `${item.class.namaKelas} - ${item.subject.namaMapel}`,
        }));

        setOptions(mapped);
      } catch (err) {
        toast.error("Gagal memuat data kelas & mapel");
      }
    };
    fetchOptions();
  }, []);

  const tersediaDari = watch("waktuMulai");
  const tersediaHingga = watch("waktuSelesai");
  const durasiMenit = watch("durasiMenit");

  // ✅ Auto-calculate duration based on waktuMulai and waktuSelesai
  useEffect(() => {
    if (tersediaDari && tersediaHingga) {
      const mulai = new Date(tersediaDari);
      const selesai = new Date(tersediaHingga);

      if (selesai > mulai) {
        const durasi = Math.floor((selesai - mulai) / 1000 / 60);
        setValue("durasiMenit", durasi);
      } else {
        setValue("durasiMenit", 0); // reset jika invalid
      }
    }
  }, [tersediaDari, tersediaHingga, setValue]);

  // ✅ Format durasi yang user-friendly
  let durasiText = "";
  if (typeof durasiMenit === "number" && durasiMenit > 0) {
    const totalMenit = durasiMenit;
    const totalDetik = totalMenit * 60;

    const hari = Math.floor(totalDetik / (60 * 60 * 24));
    const jam = Math.floor((totalDetik % (60 * 60 * 24)) / (60 * 60));
    const menit = Math.floor((totalDetik % (60 * 60)) / 60);
    const detik = totalDetik % 60;

    const parts = [];
    if (hari > 0) parts.push(`${hari} hari`);
    if (jam > 0 || hari > 0) parts.push(`${jam} jam`);
    if (menit > 0 || jam > 0 || hari > 0) parts.push(`${menit} menit`);
    if (detik > 0 || (hari === 0 && jam === 0 && menit === 0)) {
      parts.push(`${detik} detik`);
    }

    durasiText = `Durasi ini setara dengan ${parts.join(" ")}.`;
  }

  const onSubmit = async (data) => {
    // ✅ Validasi waktu sebelum submit
    if (data.waktuMulai && data.waktuSelesai) {
      const mulai = new Date(data.waktuMulai);
      const selesai = new Date(data.waktuSelesai);

      if (selesai <= mulai) {
        toast.error("Waktu selesai harus lebih besar dari waktu mulai");
        return;
      }
    }

    try {
      setLoading(true);
      const res = await api.post("/tutor/exams", data);
      const examId = res.data.data.id;
      toast.success("Ujian berhasil dibuat!");
      router.push(`/tutor/exams/${examId}/questions/create`);
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Gagal menyimpan ujian";
      toast.error(message); // Ini akan muncul error spesifik dari API (contoh: "UTS sudah pernah dibuat dalam tahun ajaran ini")
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <PageHeader
        title="Buat Ujian Baru"
        description="Lengkapi informasi umum sebelum menambahkan soal."
        breadcrumbs={[
          { label: "Ujian", href: "/tutor/exams" },
          { label: "Buat Ujian" },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
        <div>
          <Label>Judul Ujian</Label>
          <Input {...register("judul", { required: "Judul wajib diisi" })} />
          {errors.judul && (
            <p className="text-sm text-red-500">{errors.judul.message}</p>
          )}
        </div>

        <div>
          <Label>Deskripsi (Opsional)</Label>
          <Textarea {...register("deskripsi")} />
        </div>

        <div>
          <Label>Jenis Ujian</Label>
          <Select
            onValueChange={(val) =>
              setValue("jenis", val, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis ujian" />
            </SelectTrigger>
            <SelectContent>
              {JENIS_UJIAN_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.jenis && (
            <p className="text-sm text-red-500">Jenis wajib dipilih</p>
          )}
        </div>

        <div>
          <Label>Kelas & Mapel</Label>
          <Select
            onValueChange={(val) =>
              setValue("classSubjectTutorId", val, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih kelas dan mapel" />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.classSubjectTutorId && (
            <p className="text-sm text-red-500">
              Kelas dan mapel wajib dipilih
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tanggal Mulai</Label>
            <DateTimePicker
              value={tersediaDari}
              onChange={(val) =>
                setValue("waktuMulai", val, { shouldValidate: true })
              }
            />
            {errors.waktuMulai && (
              <p className="text-sm text-red-500">Waktu mulai wajib diisi</p>
            )}
          </div>
          <div>
            <Label>Tanggal Selesai</Label>
            <DateTimePicker
              value={tersediaHingga}
              onChange={(val) =>
                setValue("waktuSelesai", val, { shouldValidate: true })
              }
            />
            {errors.waktuSelesai && (
              <p className="text-sm text-red-500">Waktu selesai wajib diisi</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Durasi (menit)</Label>
            <Input
              type="number"
              disabled
              {...register("durasiMenit", {
                required: "Durasi wajib diisi",
                min: { value: 1, message: "Durasi minimal 1 menit" },
              })}
              className="bg-gray-50"
            />
            {durasiText && (
              <p className="text-sm text-muted-foreground italic mt-1">
                {durasiText}
              </p>
            )}
            {errors.durasiMenit && (
              <p className="text-sm text-red-500">
                {errors.durasiMenit.message}
              </p>
            )}
          </div>
          <div>
            <Label>Nilai Maksimal</Label>
            <Input
              type="number"
              {...register("nilaiMaksimal", {
                required: "Nilai maksimal wajib diisi",
                min: { value: 1, message: "Nilai minimal adalah 1" },
              })}
            />
            {errors.nilaiMaksimal && (
              <p className="text-sm text-red-500">
                {errors.nilaiMaksimal.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="acakSoal"
              onCheckedChange={(val) => setValue("acakSoal", val)}
            />
            <Label htmlFor="acakSoal">Acak Soal</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acakJawaban"
              onCheckedChange={(val) => setValue("acakJawaban", val)}
            />
            <Label htmlFor="acakJawaban">Acak Jawaban</Label>
          </div>
        </div>

        {/* Warning jika durasi tidak valid */}
        {tersediaDari && tersediaHingga && durasiMenit <= 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              ⚠️ Waktu selesai harus lebih besar dari waktu mulai untuk
              mendapatkan durasi yang valid.
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={
            loading || !tersediaDari || !tersediaHingga || durasiMenit <= 0
          }
        >
          {loading ? "Menyimpan..." : "Simpan & Lanjut Tambah Soal"}
        </Button>
      </form>
    </div>
  );
}
