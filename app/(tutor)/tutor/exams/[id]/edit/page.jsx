"use client";

import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Edit as EditIcon } from "lucide-react";

const JENIS_UJIAN_OPTIONS = [
  { label: "Ujian Harian", value: "DAILY_TEST" },
  { label: "Ujian Awal Semester", value: "START_SEMESTER_TEST" },
  { label: "UTS (Ujian Tengah Semester)", value: "MIDTERM" },
  { label: "UAS (Ujian Akhir Semester)", value: "FINAL_EXAM" },
];

export default function ExamEditPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id;

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [options, setOptions] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      judul: "",
      deskripsi: "",
      jenis: "",
      classSubjectTutorId: "",
      tanggalMulai: "",
      jamMulai: "",
      tanggalSelesai: "",
      jamSelesai: "",
      durasiMenit: 0,
    },
  });

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
        let durasi = Math.floor((selesai - mulai) / 1000 / 60);
        if (durasi > 1440) {
          durasi = 1440;
        }
        setValue("durasiMenit", durasi);
      } else {
        setValue("durasiMenit", 0);
      }
    }
  }, [tanggalMulai, jamMulai, tanggalSelesai, jamSelesai, setValue]);

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

  const fetchExamData = async () => {
    try {
      setIsFetching(true);
      const res = await api.get(`/tutor/exams/${examId}`);
      const exam = res.data.data;

      setValue("judul", exam.judul);
      setValue("deskripsi", exam.deskripsi || "");
      setValue("jenis", exam.jenis);
      setValue("classSubjectTutorId", exam.classSubjectTutorId);

      // Format dates to yyyy-MM-dd and times to HH:mm
      if (exam.TanggalMulai) {
        const d = new Date(exam.TanggalMulai);
        setValue("tanggalMulai", format(d, "yyyy-MM-dd"));
        setValue("jamMulai", format(d, "HH:mm"));
      }
      if (exam.TanggalSelesai) {
        const d = new Date(exam.TanggalSelesai);
        setValue("tanggalSelesai", format(d, "yyyy-MM-dd"));
        setValue("jamSelesai", format(d, "HH:mm"));
      }
      if (exam.batasWaktuMenit) {
        setValue("durasiMenit", exam.batasWaktuMenit);
      }
    } catch (error) {
      console.error("Gagal memuat data ujian:", error);
      toast.error("Gagal memuat data ujian");
      router.push("/tutor/exams");
    } finally {
      setIsFetching(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await api.get("/tutor/my-class-subjects");
      const items = res.data.data;

      const filtered = items.filter(
        (item) => item.class?.academicYear?.isActive,
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

  useEffect(() => {
    fetchOptions();
    fetchExamData();
  }, [examId]);

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

    const calculatedDurasiMenit = Math.floor((selesai - mulai) / (1000 * 60));

    // Validasi maksimal 24 jam
    if (calculatedDurasiMenit > 1440) {
      toast.error(
        "Durasi ujian maksimal 24 jam. Harap sesuaikan waktu selesai.",
      );
      return;
    }

    const payload = {
      judul: data.judul,
      deskripsi: data.deskripsi,
      jenis: data.jenis,
      classSubjectTutorId: data.classSubjectTutorId,
      tanggalMulai: mulai.toISOString(),
      tanggalSelesai: selesai.toISOString(),
      durasiMenit: calculatedDurasiMenit,
    };

    try {
      setLoading(true);
      await api.patch(`/tutor/exams/${examId}`, payload);
      toast.success("Ujian berhasil diperbarui!");
      router.push("/tutor/exams");
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Gagal memperbarui ujian";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <div className="text-center">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <PageHeader
        title="Edit Ujian"
        description="Perbarui informasi ujian yang telah dibuat."
        breadcrumbs={[
          { label: "Ujian", href: "/tutor/exams" },
          { label: "Edit Ujian" },
        ]}
      />

      <div className="mb-4">
        <Button variant="default" asChild>
          <Link href={`/tutor/exams/${examId}/questions`}>
            <EditIcon className="h-4 w-4 mr-2" />
            Edit Soal
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            value={getValues("jenis")}
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
            value={getValues("classSubjectTutorId")}
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
              {...register("tanggalMulai", {
                required: "Tanggal mulai wajib diisi",
              })}
            />
            {errors.tanggalMulai && (
              <p className="text-sm text-red-500">
                {errors.tanggalMulai.message}
              </p>
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
              {...register("tanggalSelesai", {
                required: "Tanggal selesai wajib diisi",
              })}
            />
            {errors.tanggalSelesai && (
              <p className="text-sm text-red-500">
                {errors.tanggalSelesai.message}
              </p>
            )}
          </div>
          <div>
            <Label>Jam Selesai</Label>
            <Input
              type="time"
              {...register("jamSelesai", {
                required: "Jam selesai wajib diisi",
              })}
            />
            {errors.jamSelesai && (
              <p className="text-sm text-red-500">
                {errors.jamSelesai.message}
              </p>
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
        </div>

        {tanggalMulai &&
          jamMulai &&
          tanggalSelesai &&
          jamSelesai &&
          durasiMenit <= 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                ⚠️ Waktu selesai harus lebih besar dari waktu mulai untuk
                mendapatkan durasi yang valid.
              </p>
            </div>
          )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/tutor/exams")}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={
              loading ||
              !tanggalMulai ||
              !jamMulai ||
              !tanggalSelesai ||
              !jamSelesai ||
              durasiMenit <= 0
            }
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
