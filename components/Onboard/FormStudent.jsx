"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";

export default function StudentForm({
  defaultValues = {},
  userId,
  onSuccess, // Tambahkan prop onSuccess
  classOptions = [],
}) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues, // Set default values
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/students", {
        ...formData,
        userId,
      });

      toast.success("Profil siswa berhasil disimpan!");
      onSuccess?.(); // Tutup dialog jika ada callback
      router.push("/siswa/dashboard"); // bisa diarahkan ke dashboard jika perlu
    } catch (err) {
      console.error("Error submitting student form:", err);
      let msg = "Gagal menyimpan profil siswa";
      if (typeof err?.response?.data?.message === "string") {
        msg = err.response.data.message;
      } else if (typeof err?.message === "string") {
        msg = err.message;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Nama Lengkap"
        name="namaLengkap"
        control={control}
        required
        placeholder="Nama lengkap siswa"
        error={errors.namaLengkap?.message}
        rules={{
          required: "Nama wajib diisi",
          minLength: {
            value: 3,
            message: "Nama minimal 3 karakter",
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
        required
        placeholder="Contoh: Kupang"
        rules={{
          required: "Tempat lahir wajib diisi",
          minLength: {
            value: 3,
            message: "Minimal 3 karakter",
          },
        }}
        error={errors.tempatLahir?.message}
      />

      <FormField
        label="Tanggal Lahir"
        name="tanggalLahir"
        control={control}
        type="birthdate"
        required
        placeholder="Pilih tanggal lahir"
        rules={{
          required: "Tanggal lahir wajib diisi",
          validate: (value) => {
            if (!value) return "Tanggal lahir wajib diisi";
            return true;
          },
        }}
        error={errors.tanggalLahir?.message}
      />

      <FormField
        label="No Telepon (Opsional)"
        name="noTelepon"
        control={control}
        type="text"
        placeholder="Nomor telepon siswa"
        rules={{
          pattern: {
            value: /^[0-9]{10,15}$/,
            message: "Nomor telepon harus 10-15 digit angka",
          },
        }}
        inputProps={{ maxLength: 15 }}
        onChange={(e) => {
          const rawValue = e.target.value.replace(/\D/g, "");
          setValue("noTelepon", rawValue, { shouldValidate: true });
        }}
        error={errors.noTelepon?.message}
      />

      <FormField
        label="Alamat (Opsional)"
        name="alamat"
        control={control}
        type="textarea"
        rows={4}
        rules={{
          minLength: {
            value: 10,
            message: "Alamat minimal 10 karakter jika diisi",
          },
        }}
        error={errors.alamat?.message}
      />

      <FormField
        label="Kelas"
        name="classId"
        control={control}
        type="select"
        required
        placeholder="Pilih kelas"
        error={errors.classId?.message}
        rules={{ required: "Kelas wajib dipilih" }}
        options={classOptions}
      />

      <div className="pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
