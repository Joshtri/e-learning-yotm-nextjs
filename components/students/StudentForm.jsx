"use client";

import { Form, useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import FormField from "@/components/ui/form-field";

export default function StudentForm({
  defaultValues = {},
  onSubmit,
  classOptions = [],
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...defaultValues,
      tanggalLahir: defaultValues.tanggalLahir
        ? new Date(defaultValues.tanggalLahir).toISOString()
        : "",
    },
  });

  const handleFormSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <FormField
        label="Nama Lengkap"
        name="namaLengkap"
        control={control}
        required
        placeholder="Nama lengkap siswa"
        error={errors.namaLengkap?.message}
        rules={{
          required: "Nama wajib diisi",
          minLength: { value: 3, message: "Nama minimal 3 karakter" },
        }}
      />

      <FormField
        label="NISN"
        name="nisn"
        control={control}
        required
        placeholder="10 digit NISN"
        error={errors.nisn?.message}
        maxLength={10}
        onKeyDown={(e) => {
          if (!/[0-9]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(e.key)) {
            e.preventDefault();
          }
        }}
        rules={{
          required: "NISN wajib diisi",
          pattern: {
            value: /^[0-9]{10}$/,
            message: "NISN harus 10 digit angka",
          },
        }}
      />
      <FormField
        label="No Telepon"
        name="noTelepon"
        control={control}
        required
        placeholder="Contoh: 08123456789"
        error={errors.noTelepon?.message}
        rules={{
          required: "No telepon wajib diisi",
          pattern: {
            value: /^[0-9]{10,12}$/,
            message: "No telepon harus 10-12 digit angka",
          },
        }}
      />

      <FormField
        label="NIS"
        name="nis"
        control={control}
        required
        placeholder="Contoh: 1234567890"
        error={errors.nis?.message}
        rules={{
          required: "NIS wajib diisi",
          pattern: {
            value: /^[0-9]{10}$/,
            message: "NIS harus 10 digit angka",
          },
        }}
      />

      

      <FormField
        label="Jenis Kelamin"
        name="jenisKelamin"
        control={control}
        type="select"
        required
        options={[
          { label: "Laki-laki", value: "MALE" },
          { label: "Perempuan", value: "FEMALE" },
          { label: "Lainnya", value: "OTHER" },
        ]}
        rules={{ required: "Jenis kelamin wajib dipilih" }}
        error={errors.jenisKelamin?.message}
      />

      <FormField
        label="Tempat Lahir"
        name="tempatLahir"
        control={control}
        placeholder="Contoh: Kupang"
        rules={{
          required: "Tempat lahir wajib diisi",
          minLength: { value: 3, message: "Minimal 3 karakter" },
        }}
        error={errors.tempatLahir?.message}
      />

      <FormField
        label="Tanggal Lahir"
        name="tanggalLahir"
        control={control}
        type="datetime"
        required
        placeholder="Pilih tanggal lahir"
        rules={{
          required: "Tanggal lahir wajib diisi",
          validate: (value) => {
            if (!value) return "Tanggal lahir wajib diisi";
            const birthDate = new Date(value);
            const today = new Date();
            if (birthDate > today) return "Tanggal lahir tidak valid";
            return true;
          },
        }}
        error={errors.tanggalLahir?.message}
      />

      <FormField
        label="Alamat"
        name="alamat"
        control={control}
        type="textarea"
        rows={4}
        rules={{
          required: "Alamat wajib diisi",
          minLength: { value: 10, message: "Alamat minimal 10 karakter" },
        }}
        error={errors.alamat?.message}
      />

      <FormField
        label="Kelas"
        name="classId"
        control={control}
        type="select"
        options={classOptions
          .filter((cls) => cls.academicYear?.isActive)
          .map((cls) => ({
            label: `${cls.namaKelas} (${cls.program?.namaPaket}) - ${cls.academicYear?.tahunMulai}/${cls.academicYear?.tahunSelesai}`,
            value: cls.id,
          }))}
        placeholder="Pilih kelas"
        error={errors.classId?.message}
        required
      />

      <div className="pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            "Simpan Perubahan"
          )}
        </Button>
      </div>
    </form>
  );
}
