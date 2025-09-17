"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { format } from "date-fns";
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
      tanggalMulai: format(new Date(), "yyyy-MM-dd"),
      jamMulai: "",
      tanggalSelesai: format(new Date(), "yyyy-MM-dd"),
      jamSelesai: "",
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

  const tanggalMulai = watch("tanggalMulai");
  const jamMulai = watch("jamMulai");
  const tanggalSelesai = watch("tanggalSelesai");
  const jamSelesai = watch("jamSelesai");
  const durasiMenit = watch("durasiMenit");

  useEffect(() => {
    if (tanggalMulai && jamMulai && tanggalSelesai && jamSelesai) {
      const mulai = new Date(`${tanggalMulai}T${jamMulai}`);
      const selesai = new Date(`${tanggalSelesai}T${jamSelesai}`);

      if (selesai > mulai) {
        const durasi = Math.floor((selesai - mulai) / 1000 / 60);
        setValue("durasiMenit", durasi);
      } else {
        setValue("durasiMenit", 0);
      }
    }
  }, [tanggalMulai, jamMulai, tanggalSelesai, jamSelesai, setValue]);

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
    if (!data.jamMulai || !data.jamSelesai) {
      toast.error("Jam mulai dan jam selesai wajib diisi");
      return;
    }

    const mulai = new Date(`${data.tanggalMulai}T${data.jamMulai}`);
    const selesai = new Date(`${data.tanggalSelesai}T${data.jamSelesai}`);

    if (selesai <= mulai) {
      toast.error("Waktu selesai harus lebih besar dari waktu mulai");
      return;
    }

    const payload = {
      ...data,
      waktuMulai: mulai.toISOString(),
      waktuSelesai: selesai.toISOString(),
    };

    try {
      setLoading(true);
      const res = await api.post("/tutor/exams", payload);
      const examId = res.data.data.id;
      toast.success("Ujian berhasil dibuat!");
      router.push(`/tutor/exams/${examId}/questions/create`);
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Gagal menyimpan ujian";
      toast.error(message);
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
            <Input
              type="date"
              min={format(new Date(), "yyyy-MM-dd")}
              {...register("tanggalMulai", {
                required: "Tanggal mulai wajib diisi",
                validate: (value) => {
                  const selectedDate = new Date(value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return selectedDate >= today || "Tanggal tidak boleh sebelum hari ini";
                }
              })}
            />
            {errors.tanggalMulai && (
              <p className="text-sm text-red-500">{errors.tanggalMulai.message}</p>
            )}
          </div>
          <div>
            <Label>Jam Mulai</Label>
            <Input
              type="time"
              {...register("jamMulai", { required: "Jam mulai wajib diisi" })}
            />
            {errors.jamMulai && (
              <p className="text-sm text-red-500">{errors.jamMulai.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tanggal Selesai</Label>
            <Input
              type="date"
              min={format(new Date(), "yyyy-MM-dd")}
              {...register("tanggalSelesai", {
                required: "Tanggal selesai wajib diisi",
                validate: (value) => {
                  const selectedDate = new Date(value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return selectedDate >= today || "Tanggal tidak boleh sebelum hari ini";
                }
              })}
            />
            {errors.tanggalSelesai && (
              <p className="text-sm text-red-500">{errors.tanggalSelesai.message}</p>
            )}
          </div>
          <div>
            <Label>Jam Selesai</Label>
            <Input
              type="time"
              {...register("jamSelesai", { required: "Jam selesai wajib diisi" })}
            />
            {errors.jamSelesai && (
              <p className="text-sm text-red-500">{errors.jamSelesai.message}</p>
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

        {tanggalMulai && jamMulai && tanggalSelesai && jamSelesai && durasiMenit <= 0 && (
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
            loading || !tanggalMulai || !jamMulai || !tanggalSelesai || !jamSelesai || durasiMenit <= 0
          }
        >
          {loading ? "Menyimpan..." : "Simpan & Lanjut Tambah Soal"}
        </Button>
      </form>
    </div>
  );
}
