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
      tanggalSelesai: "",
      nilaiMaksimal: 100,
    },
  });

  const fetchExamData = async () => {
    try {
      setIsFetching(true);
      const res = await api.get(`/tutor/exams/${examId}`);
      const exam = res.data.data;

      // Set form values with existing data
      setValue("judul", exam.judul);
      setValue("deskripsi", exam.deskripsi || "");
      setValue("jenis", exam.jenis);
      setValue("classSubjectTutorId", exam.classSubjectTutorId);
      setValue("nilaiMaksimal", exam.nilaiMaksimal || 100);

      // Format dates to yyyy-MM-dd for input[type="date"]
      if (exam.TanggalMulai) {
        setValue(
          "tanggalMulai",
          format(new Date(exam.TanggalMulai), "yyyy-MM-dd")
        );
      }
      if (exam.TanggalSelesai) {
        setValue(
          "tanggalSelesai",
          format(new Date(exam.TanggalSelesai), "yyyy-MM-dd")
        );
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

  useEffect(() => {
    fetchOptions();
    fetchExamData();
  }, [examId]);

  const onSubmit = async (data) => {
    const payload = {
      judul: data.judul,
      deskripsi: data.deskripsi,
      jenis: data.jenis,
      classSubjectTutorId: data.classSubjectTutorId,
      tanggalMulai: data.tanggalMulai,
      tanggalSelesai: data.tanggalSelesai,
      nilaiMaksimal: Number(data.nilaiMaksimal),
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
                validate: {
                  beforeEndDate: (value) => {
                    const endDate = getValues("tanggalSelesai");
                    if (!endDate) return true;
                    return (
                      new Date(value) <= new Date(endDate) ||
                      "Tanggal mulai harus sama dengan atau sebelum tanggal selesai"
                    );
                  },
                },
              })}
            />
            {errors.tanggalMulai && (
              <p className="text-sm text-red-500">
                {errors.tanggalMulai.message}
              </p>
            )}
          </div>
          <div>
            <Label>Tanggal Selesai</Label>
            <Input
              type="date"
              {...register("tanggalSelesai", {
                required: "Tanggal selesai wajib diisi",
                validate: {
                  afterStartDate: (value) => {
                    const startDate = getValues("tanggalMulai");
                    if (!startDate) return true;
                    return (
                      new Date(value) >= new Date(startDate) ||
                      "Tanggal selesai harus sama dengan atau setelah tanggal mulai"
                    );
                  },
                },
              })}
            />
            {errors.tanggalSelesai && (
              <p className="text-sm text-red-500">
                {errors.tanggalSelesai.message}
              </p>
            )}
          </div>
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

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/tutor/exams")}
          >
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
