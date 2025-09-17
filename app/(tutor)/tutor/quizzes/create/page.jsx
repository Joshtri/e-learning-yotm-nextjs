"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import { useWatch, useFormContext } from "react-hook-form";

export default function QuizCreatePage() {
  const router = useRouter();
  const [classSubjects, setClassSubjects] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      judul: "",
      deskripsi: "",
      classSubjectTutorId: "",
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
    const fetchClassSubjects = async () => {
      try {
        const res = await api.get("/tutor/my-class-subjects");
        setClassSubjects(res.data.data);
      } catch (error) {
        toast.error("Gagal memuat kelas & mapel");
      }
    };
    fetchClassSubjects();
  }, []);

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
      ...data,
      waktuMulai: mulai.toISOString(),
      waktuSelesai: selesai.toISOString(),
      durasiMenit,
    };

    console.log("Data Step 1:", payload);

    sessionStorage.setItem("quizInfo", JSON.stringify(payload));

    router.push("/tutor/quizzes/create/questions");
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

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Buat Kuis - Info Umum</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <FormField
            label="Tanggal Mulai"
            name="tanggalMulai"
            type="date"
            control={control}
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
            error={errors.tanggalMulai?.message}
          />
          <FormField
            label="Jam Mulai"
            name="jamMulai"
            type="time"
            control={control}
            {...register("jamMulai", { required: "Jam mulai wajib diisi" })}
            error={errors.jamMulai?.message}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            label="Tanggal Selesai"
            name="tanggalSelesai"
            type="date"
            control={control}
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
            error={errors.tanggalSelesai?.message}
          />
          <FormField
            label="Jam Selesai"
            name="jamSelesai"
            type="time"
            control={control}
            {...register("jamSelesai", { required: "Jam selesai wajib diisi" })}
            error={errors.jamSelesai?.message}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            label="Durasi (menit)"
            name="durasiMenit"
            control={control}
            type="number"
            placeholder="Durasi dalam menit"
            disabled
            {...register("durasiMenit", { valueAsNumber: true })}
            error={errors.durasiMenit?.message}
          />

          {durasiText && (
            <p className="text-sm text-muted-foreground italic">{durasiText}</p>
          )}

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

        <div className="flex justify-end">
          <Button type="submit">Lanjut ke Soal</Button>
        </div>
      </form>
    </div>
  );
}
