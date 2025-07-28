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
      const msg =
        err?.response?.data?.message || "Gagal menyimpan profil siswa";
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
        label="NISN"
        name="nisn"
        control={control}
        required
        placeholder="10 digit NISN"
        error={errors.nisn?.message}
        maxLength={10}
        onKeyDown={(e) => {
          // Only allow numbers and control keys
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
          validate: (value) => {
            if (value.length !== 10) return "NISN harus tepat 10 digit";
            return true;
          },
        }}
      />

      <FormField
        label="NIS"
        name="nis"
        control={control}
        required
        placeholder="NIS siswa"
        rules={{
          required: "NIS wajib diisi",
          // Uncomment jika ingin validasi format khusus
          // pattern: {
          //   value: /^[0-9]{8}$/,
          //   message: "NIS harus 8 digit angka",
          // },
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
            // Add additional validation if needed (e.g., minimum age)
            return true;
          },
        }}
        error={errors.tanggalLahir?.message}
      />

      <FormField
        label="No Telepon"
        name="noTelepon"
        control={control}
        type="text"
        required
        placeholder="Nomor telepon siswa"
        rules={{
          required: "Nomor telepon wajib diisi",
          pattern: {
            value: /^[0-9]{10,15}$/,
            message: "Nomor telepon harus 10-15 digit angka",
          },
        }}
        inputProps={{ maxLength: 15 }} // maksimal 15 digit
        onChange={(e) => {
          const rawValue = e.target.value.replace(/\D/g, ""); // hanya angka
          setValue("noTelepon", rawValue, { shouldValidate: true }); // Fix: gunakan setValue bukan form.setValue
        }}
        error={errors.noTelepon?.message}
      />

      <FormField
        label="Alamat"
        name="alamat"
        control={control}
        type="textarea"
        required
        rows={4}
        rules={{
          required: "Alamat wajib diisi",
          minLength: {
            value: 10,
            message: "Alamat minimal 10 karakter",
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
