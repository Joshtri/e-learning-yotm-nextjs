"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/form-field";

export default function StudentForm({
  defaultValues = {},
  onSubmit,
  classOptions = [],
}) {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Nama Lengkap"
        name="namaLengkap"
        control={control}
        required
        placeholder="Nama lengkap siswa"
        error={errors.namaLengkap?.message}
        {...register("namaLengkap", { required: "Nama wajib diisi" })}
      />

      <FormField
        label="NISN"
        name="nisn"
        control={control}
        required
        placeholder="NISN siswa"
        error={errors.nisn?.message}
        {...register("nisn", { required: "NISN wajib diisi" })}
      />

      <FormField
        label="Jenis Kelamin"
        name="jenisKelamin"
        control={control}
        type="select"
        options={[
          { label: "Laki-laki", value: "MALE" },
          { label: "Perempuan", value: "FEMALE" },
          { label: "Lainnya", value: "OTHER" },
        ]}
        {...register("jenisKelamin")}
      />

      <FormField
        label="Tempat Lahir"
        name="tempatLahir"
        control={control}
        placeholder="Contoh: Kupang"
        {...register("tempatLahir")}
      />

      <FormField
        label="Tanggal Lahir"
        name="tanggalLahir"
        control={control}
        type="date"
        {...register("tanggalLahir")}
      />

      <FormField
        label="Alamat"
        name="alamat"
        control={control}
        type="textarea"
        {...register("alamat")}
      />

      {/* 👇 Tambahkan Select Class */}
      <FormField
        label="Kelas"
        name="classId"
        control={control}
        type="select"
        options={classOptions
          .filter((cls) => cls.academicYear?.isActive) // 🔍 hanya tahun ajar aktif
          .map((cls) => ({
            label: `${cls.namaKelas} (${cls.program?.namaPaket}) - ${cls.academicYear?.tahunMulai}/${cls.academicYear?.tahunSelesai}`,
            value: cls.id,
          }))}
        placeholder="Pilih kelas"
        {...register("classId")}
      />

      <div className="pt-4">
        <Button type="submit">Simpan Perubahan</Button>
      </div>
    </form>
  );
}
