"use client";

import { useForm, useWatch } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";

export default function QuizEditPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id;

  const [classSubjects, setClassSubjects] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      judul: "",
      deskripsi: "",
      classSubjectTutorId: "",
      tanggalMulai: "",
      jamMulai: "",
      tanggalSelesai: "",
      jamSelesai: "",
      durasiMenit: 60,
      nilaiMaksimal: 100,
      acakSoal: false,
      acakJawaban: false,
    },
  });

  const fetchQuizData = async () => {
    try {
      setIsFetching(true);
      const res = await api.get(`/tutor/quizzes/${quizId}`);
      const quiz = res.data.data;

      // Set form values with existing data
      setValue("judul", quiz.judul);
      setValue("deskripsi", quiz.deskripsi || "");
      setValue("classSubjectTutorId", quiz.classSubjectTutorId);
      setValue("nilaiMaksimal", quiz.nilaiMaksimal);
      setValue("durasiMenit", quiz.durasiMenit);
      setValue("acakSoal", quiz.acakSoal);
      setValue("acakJawaban", quiz.acakJawaban);

      // Parse waktuMulai
      if (quiz.waktuMulai) {
        const mulai = new Date(quiz.waktuMulai);
        setValue("tanggalMulai", format(mulai, "yyyy-MM-dd"));
        setValue("jamMulai", format(mulai, "HH:mm"));
      }

      // Parse waktuSelesai
      if (quiz.waktuSelesai) {
        const selesai = new Date(quiz.waktuSelesai);
        setValue("tanggalSelesai", format(selesai, "yyyy-MM-dd"));
        setValue("jamSelesai", format(selesai, "HH:mm"));
      }
    } catch (error) {
      console.error("Gagal memuat data kuis:", error);
      toast.error("Gagal memuat data kuis");
      router.push("/tutor/quizzes");
    } finally {
      setIsFetching(false);
    }
  };

  const fetchClassSubjects = async () => {
    try {
      const res = await api.get("/tutor/my-class-subjects");
      setClassSubjects(res.data.data);
    } catch (error) {
      toast.error("Gagal memuat kelas & mapel");
    }
  };

  useEffect(() => {
    fetchClassSubjects();
    fetchQuizData();
  }, [quizId]);

  const tanggalMulai = useWatch({ control, name: "tanggalMulai" });
  const jamMulai = useWatch({ control, name: "jamMulai" });
  const tanggalSelesai = useWatch({ control, name: "tanggalSelesai" });
  const jamSelesai = useWatch({ control, name: "jamSelesai" });

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

    const durasiMenit = Math.floor((selesai - mulai) / (1000 * 60));

    const payload = {
      judul: data.judul,
      deskripsi: data.deskripsi,
      classSubjectTutorId: data.classSubjectTutorId,
      waktuMulai: mulai.toISOString(),
      waktuSelesai: selesai.toISOString(),
      durasiMenit,
      nilaiMaksimal: Number(data.nilaiMaksimal),
      acakSoal: data.acakSoal,
      acakJawaban: data.acakJawaban,
    };

    try {
      setIsSubmitting(true);
      await api.patch(`/tutor/quizzes/${quizId}`, payload);
      toast.success("Kuis berhasil diperbarui");
      router.push("/tutor/quizzes");
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast.error("Gagal memperbarui kuis. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const durasi = useWatch({ control, name: "durasiMenit" });

  let durasiText = "";
  if (typeof durasi === "number" && durasi > 0) {
    const totalMenit = durasi;
    const totalDetik = totalMenit * 60;

    const hari = Math.floor(totalDetik / (60 * 60 * 24));
    const jam = Math.floor((totalDetik % (60 * 60 * 24)) / (60 * 60));
    const menit = Math.floor((totalDetik % (60 * 60)) / 60);
    const detik = totalDetik % 60;

    const parts = [];
    if (hari > 0) parts.push(`${hari} hari`);
    if (jam > 0 || hari > 0) parts.push(`${jam} jam`);
    if (menit > 0 || jam > 0 || hari > 0) parts.push(`${menit} menit`);
    parts.push(`${detik} detik`);

    durasiText = `Durasi ini setara dengan ${parts.join(" ")}.`;
  }

  if (isFetching) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <PageHeader
        title="Edit Kuis"
        description="Perbarui informasi kuis yang telah dibuat."
        breadcrumbs={[
          { label: "Kuis", href: "/tutor/quizzes" },
          { label: "Edit Kuis" },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
        <FormField
          label="Judul Kuis"
          name="judul"
          type="text"
          control={control}
          {...register("judul", { required: "Judul wajib diisi" })}
          error={errors.judul?.message}
        />

        <FormField
          label="Deskripsi"
          control={control}
          name="deskripsi"
          type="textarea"
          placeholder="Tuliskan deskripsi kuis"
          {...register("deskripsi")}
        />

        <FormField
          label="Kelas & Mapel"
          name="classSubjectTutorId"
          type="select"
          control={control}
          placeholder="Pilih Kelas dan Mapel"
          options={classSubjects.map((item) => ({
            value: item.id,
            label: `${item.class.namaKelas} - ${item.subject.namaMapel}`,
          }))}
          {...register("classSubjectTutorId", {
            required: "Kelas dan Mapel wajib dipilih",
          })}
          error={errors.classSubjectTutorId?.message}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="tanggalMulai" className="text-sm font-medium">
              Tanggal Mulai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="tanggalMulai"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          <div className="space-y-2">
            <label htmlFor="jamMulai" className="text-sm font-medium">
              Jam Mulai <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="jamMulai"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register("jamMulai", { required: "Jam mulai wajib diisi" })}
            />
            {errors.jamMulai && (
              <p className="text-sm text-red-500">{errors.jamMulai.message}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="tanggalSelesai" className="text-sm font-medium">
              Tanggal Selesai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="tanggalSelesai"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          <div className="space-y-2">
            <label htmlFor="jamSelesai" className="text-sm font-medium">
              Jam Selesai <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="jamSelesai"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="durasiMenit" className="text-sm font-medium">
              Durasi (menit)
            </label>
            <input
              type="number"
              id="durasiMenit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Durasi dalam menit"
              readOnly
              {...register("durasiMenit", { valueAsNumber: true })}
            />
            {durasiText && (
              <p className="text-sm text-muted-foreground italic">
                {durasiText}
              </p>
            )}
            {errors.durasiMenit && (
              <p className="text-sm text-red-500">
                {errors.durasiMenit.message}
              </p>
            )}
          </div>

          <FormField
            label="Nilai Maksimal"
            name="nilaiMaksimal"
            control={control}
            placeholder="Nilai maksimal kuis"
            type="number"
            {...register("nilaiMaksimal", { valueAsNumber: true })}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            label="Acak Soal"
            name="acakSoal"
            control={control}
            placeholder="Acak soal dalam kuis"
            type="checkbox"
            {...register("acakSoal")}
          />
          <FormField
            label="Acak Jawaban"
            name="acakJawaban"
            control={control}
            placeholder="Acak jawaban dalam kuis"
            type="checkbox"
            {...register("acakJawaban")}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/tutor/quizzes")}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
