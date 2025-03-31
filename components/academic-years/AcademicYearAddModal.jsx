"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ModalForm from "@/components/ui/modal-form";
import FormField from "@/components/ui/form-field";
import api from "@/lib/axios";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function AcademicYearAddModal({ open, onClose, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      tahunMulai: "",
      tahunSelesai: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        tahunMulai: parseInt(data.tahunMulai),
        tahunSelesai: parseInt(data.tahunSelesai),
      };

      await api.post("/academic-years", payload);

      toast.success("Tahun ajaran berhasil ditambahkan");
      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Gagal tambah tahun ajaran:", err);
      toast.error("Gagal menyimpan tahun ajaran");
    }
  };

  return (
    <ModalForm
      isOpen={open}
      onClose={onClose}
      title="Tambah Tahun Ajaran"
      description="Masukkan informasi tahun ajaran baru"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Alert variant="default" className="mb-4">
        <Info className="h-4 w-4 text-blue-500 mr-2" />
        <AlertDescription>
          Format tahun ajaran berupa angka, contoh: 2024 / 2025
        </AlertDescription>
      </Alert>

      <FormField
        label="Tahun Mulai"
        name="tahunMulai"
        type="number"
        control={control}
        placeholder="Contoh: 2024"
        {...register("tahunMulai", {
          required: "Tahun mulai wajib diisi",
          min: { value: 2000, message: "Minimal tahun 2000" },
        })}
        error={errors.tahunMulai?.message}
      />

      <FormField
        label="Tahun Selesai"
        name="tahunSelesai"
        type="number"
        control={control}
        placeholder="Contoh: 2025"
        {...register("tahunSelesai", {
          required: "Tahun selesai wajib diisi",
          min: { value: 2000, message: "Minimal tahun 2000" },
        })}
        error={errors.tahunSelesai?.message}
      />
    </ModalForm>
  );
}
