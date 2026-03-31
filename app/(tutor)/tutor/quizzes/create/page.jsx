"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { useWatch } from "react-hook-form";

export default function QuizCreatePage() {
  const router = useRouter();
  const [classSubjects, setClassSubjects] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      judul: "",
      deskripsi: "",
      classSubjectTutorId: "",
      durasiMenit: 60,
      nilaiMaksimal: 70,
      acakSoal: false,
      acakJawaban: false,
    },
  });

  useEffect(() => {
    const fetchClassSubjects = async () => {
      try {
        const res = await api.get("/tutor/my-class-subjects");
        setClassSubjects(res.data.data);
      } catch {
        toast.error("Gagal memuat kelas & mapel");
      }
    };
    fetchClassSubjects();
  }, []);


  const onSubmit = async (data) => {
    const hariIni = new Date();
    // Default waktu mulai sekarang, waktu selesai 2099 biar "Always Open"
    const mulai = hariIni;
    const selesai = new Date("2099-12-31T23:59:59Z");

    const payload = {
      ...data,
      waktuMulai: mulai.toISOString(),
      waktuSelesai: selesai.toISOString(),
      durasiMenit: Number(data.durasiMenit),
    };

    try {
      sessionStorage.setItem("quizInfo", JSON.stringify(payload));
      
      const saved = sessionStorage.getItem("quizInfo");
      const parsedSaved = JSON.parse(saved || "{}");

      if (parsedSaved.judul && parsedSaved.classSubjectTutorId) {
        router.push("/tutor/quizzes/create/questions");
      } else {
        throw new Error("Data tidak tersimpan dengan benar");
      }
    } catch {
      toast.error("Gagal menyimpan data quiz. Coba lagi.");
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
            label: `${item.class.namaKelas} - ${item.subject.namaMapel} (${item.class.academicYear.tahunMulai}/${item.class.academicYear.tahunSelesai} - ${item.class.academicYear.semester})`,
          }))}
          {...register("classSubjectTutorId", {
            required: "Kelas dan Mapel wajib dipilih",
          })}
          error={errors.classSubjectTutorId?.message}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="durasiMenit">Durasi (Menit)</Label>
            <input
              type="number"
              id="durasiMenit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Masukkan durasi dalam menit"
              {...register("durasiMenit", {
                required: "Durasi wajib diisi",
                valueAsNumber: true,
                min: { value: 1, message: "Durasi minimal 1 menit" },
              })}
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
            label="KKM (Kriteria Ketuntasan Minimal)"
            name="nilaiMaksimal"
            control={control}
            placeholder="Nilai KKM"
            type="number"
            {...register("nilaiMaksimal", { valueAsNumber: true })}
            description="Batas remedial: 3x jika nilai < KKM"
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
