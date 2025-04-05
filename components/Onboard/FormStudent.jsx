"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import { GraduationCap } from "lucide-react";

export function FormStudent({ userId, onSuccess }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm();

  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      await axios.post("/api/students", { ...data, userId });
      toast.success("Berhasil menyimpan data profil siswa!");
      localStorage.setItem("onboardSuccess", "true");
      onSuccess?.();
      router.push("/student/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.message || "Gagal menyimpan data. Coba lagi.";
      toast.error(message);
    }
  };

  return (
    <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-gray-100 p-3 rounded-full">
          <GraduationCap className="h-8 w-8 text-gray-700" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Nama Lengkap"
          name="namaLengkap"
          placeholder="Masukkan nama lengkap"
          required
          error={errors.namaLengkap?.message}
          register={register}
          rules={{ required: "Nama lengkap wajib diisi" }}
        />

        <FormField
          label="NISN"
          name="nisn"
          placeholder="Masukkan NISN"
          required
          error={errors.nisn?.message}
          register={register}
          rules={{ required: "NISN wajib diisi" }}
        />

        <FormField
          type="select"
          label="Jenis Kelamin"
          name="jenisKelamin"
          placeholder="Pilih jenis kelamin"
          control={control}
          rules={{ required: "Jenis kelamin wajib dipilih" }}
          error={errors.jenisKelamin?.message}
          options={[
            { value: "MALE", label: "Laki-laki" },
            { value: "FEMALE", label: "Perempuan" },
          ]}
        />

        <FormField
          label="Tempat Lahir"
          name="tempatLahir"
          placeholder="Contoh: Kupang"
          required
          error={errors.tempatLahir?.message}
          register={register}
          rules={{ required: "Tempat lahir wajib diisi" }}
        />

        <FormField
          type="date"
          label="Tanggal Lahir"
          name="tanggalLahir"
          placeholder="Pilih tanggal lahir"
          control={control}
          rules={{ required: "Tanggal lahir wajib diisi" }}
          error={errors.tanggalLahir?.message}
        />

        <FormField
          type="textarea"
          label="Alamat"
          name="alamat"
          placeholder="Contoh: Jl. Pendidikan No. 123"
          required
          rows={3}
          error={errors.alamat?.message}
          register={register}
          rules={{ required: "Alamat wajib diisi" }}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Data Siswa"}
        </Button>
      </form>
    </div>
  );
}
