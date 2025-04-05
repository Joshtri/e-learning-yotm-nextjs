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
import { DateTimePicker } from "@/components/ui/date-time-picker"; // pastikan ada atau sesuaikan

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
  } = useForm();

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await api.get("/tutor/my-class-subjects");
        const mapped = res.data.data.map((item) => ({
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

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post("/tutor/exams", data);
      const examId = res.data.data.id; // Ambil ID ujian dari response
      toast.success("Ujian berhasil dibuat!");
      router.push(`/tutor/exams/${examId}/questions/create`); // Redirect ke tambah soal
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan ujian");
    } finally {
      setLoading(false);
    }
  };
  const tersediaDari = watch("waktuMulai");
  const tersediaHingga = watch("waktuSelesai");
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <PageHeader
        title="Buat Ujian Baru"
        description="Lengkapi informasi umum sebelum menambahkan soal."
        breadcrumbs={[
          { title: "Ujian", href: "/tutor/exams" },
          { title: "Buat Ujian", href: "/tutor/exams/create" },
        ]}
        
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Judul Ujian</Label>
          <Input {...register("judul", { required: true })} />
          {errors.judul && (
            <p className="text-sm text-red-500">Judul wajib diisi</p>
          )}
        </div>

        <div>
          <Label>Deskripsi (Opsional)</Label>
          <Textarea {...register("deskripsi")} />
        </div>

        <div>
          <Label>Jenis Ujian</Label>
          <Select onValueChange={(val) => setValue("jenis", val)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis ujian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MIDTERM">UTS</SelectItem>
              <SelectItem value="FINAL_EXAM">UAS</SelectItem>
            </SelectContent>
          </Select>
          {errors.jenis && (
            <p className="text-sm text-red-500">Jenis wajib dipilih</p>
          )}
        </div>

        <div>
          <Label>Kelas & Mapel</Label>
          <Select onValueChange={(val) => setValue("classSubjectTutorId", val)}>
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
          </div>
          <div>
            <Label>Tanggal Selesai</Label>
            <DateTimePicker
              value={tersediaHingga}
              onChange={(val) =>
                setValue("waktuSelesai", val, { shouldValidate: true })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Durasi (menit)</Label>
            <Input
              type="number"
              {...register("durasiMenit", { required: true })}
            />
          </div>
          <div>
            <Label>Nilai Maksimal</Label>
            <Input
              type="number"
              {...register("nilaiMaksimal", { required: true })}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Checkbox
            id="acakSoal"
            onCheckedChange={(val) => setValue("acakSoal", val)}
          />
          <Label htmlFor="acakSoal">Acak Soal</Label>

          <Checkbox
            id="acakJawaban"
            onCheckedChange={(val) => setValue("acakJawaban", val)}
          />
          <Label htmlFor="acakJawaban">Acak Jawaban</Label>
        </div>

        <Button type="submit" disabled={loading}>
          Simpan & Lanjut Tambah Soal
        </Button>
      </form>
    </div>
  );
}
