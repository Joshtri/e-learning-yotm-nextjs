"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ModalForm from "@/components/ui/modal-form";
import FormField from "@/components/ui/form-field";
import api from "@/lib/axios";

export default function SubjectCreateModal({
  open,
  onClose,
  onSuccess,
  programs,
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      namaMapel: "",
      deskripsi: "",
      programId: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        namaMapel: data.namaMapel.trim(),
        deskripsi: data.deskripsi?.trim() || null,
        programId: data.programId || null,
      };

      const res = await api.post("/subjects", payload);

      if (res.data.success) {
        toast.success("Mata pelajaran berhasil ditambahkan");
        reset();
        onClose();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(res.data.message || "Gagal menambahkan mapel");
      }
    } catch (err) {
      console.error("Gagal tambah mapel:", err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <ModalForm
      isOpen={open}
      onClose={onClose}
      title="Tambah Mata Pelajaran"
      description="Isi nama dan deskripsi mata pelajaran"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField
        label="Nama Mapel"
        name="namaMapel"
        control={control}
        placeholder="Contoh: Matematika"
        {...register("namaMapel", { required: "Nama mapel wajib diisi" })}
        error={errors.namaMapel?.message}
      />

      <FormField
        label="Deskripsi"
        name="deskripsi"
        control={control}
        placeholder="Deskripsi mata pelajaran (opsional)"
        type="textarea"
        {...register("deskripsi")}
        error={errors.deskripsi?.message}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium">Paket/Program</label>
        <select
          {...register("programId", { required: "Program wajib dipilih" })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">-- Pilih Program --</option>
          {programs?.map((program) => (
            <option key={program.id} value={program.id}>
              {program.namaPaket}
            </option>
          ))}
        </select>
        {errors.programId && (
          <p className="text-xs text-red-500">{errors.programId.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Pilih paket/program dimana mata pelajaran ini tersedia
        </p>
      </div>
    </ModalForm>
  );
}
