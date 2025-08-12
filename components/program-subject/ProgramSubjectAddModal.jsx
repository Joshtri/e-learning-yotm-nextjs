"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ModalForm from "@/components/ui/modal-form";
import FormField from "@/components/ui/form-field";
import api from "@/lib/axios";

export default function ProgramSubjectAddModal({
  open,
  onClose,
  onSuccess,
  programs = [],
  subjects = [],
  editData,
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { programId: "", subjectId: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (editData) {
      reset({
        programId: editData?.program?.id ?? "",
        subjectId: editData?.subject?.id ?? "",
      });
    } else {
      reset({ programId: "", subjectId: "" });
    }
  }, [editData, open, reset]);

  const onSubmit = async (formData) => {
    try {
      if (editData) {
        await api.put(`/program-subjects/${editData.id}`, formData);
        toast.success("✅ Berhasil memperbarui data");
      } else {
        await api.post("/program-subjects", formData);
        toast.success("✅ Berhasil menambahkan data");
      }

      reset();
      onClose?.();
      onSuccess?.();
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;

      // menampilkan di toast sonner
      const showError = (msg) => {
        toast.error(msg, {
          description: `Kode error: ${status || "unknown"}`,
          duration: 4000,
        });
      };

      if (status === 409) {
        showError(serverMsg || "❌ Mata pelajaran sudah ada di program ini.");
        setError("programId", {
          type: "manual",
          message: "Kombinasi ini sudah terdaftar",
        });
        setError("subjectId", {
          type: "manual",
          message: "Kombinasi ini sudah terdaftar",
        });
      } else if (status === 400) {
        showError(serverMsg || "⚠️ Input tidak valid.");
      } else if (status === 422) {
        showError(serverMsg || "⚠️ Validasi gagal.");
      } else if (status === 404) {
        showError(serverMsg || "⚠️ Data tidak ditemukan.");
      } else if (status === 500) {
        showError(serverMsg || "💥 Terjadi kesalahan server.");
      } else {
        showError(serverMsg || "❌ Gagal menyimpan data.");
      }
    }
  };

  return (
    <ModalForm
      isOpen={open}
      onClose={onClose}
      title={editData ? "Edit Mapel Program" : "Tambah Mapel ke Program"}
      description={
        editData
          ? "Perbarui informasi program dan mata pelajaran"
          : "Pilih program dan mata pelajaran yang ingin ditambahkan"
      }
      onSubmit={handleSubmit(onSubmit)}
      submitDisabled={isSubmitting}
      submitText={
        isSubmitting ? "Menyimpan..." : editData ? "Simpan Perubahan" : "Tambah"
      }
    >
      <FormField
        label="Program"
        name="programId"
        type="select"
        control={control}
        placeholder="Pilih program"
        {...register("programId", { required: "Program wajib dipilih" })}
        options={
          Array.isArray(programs)
            ? programs.map((p) => ({ value: p.id, label: p.namaPaket }))
            : []
        }
        error={errors?.programId?.message}
      />

      <FormField
        label="Mata Pelajaran"
        name="subjectId"
        type="select"
        control={control}
        placeholder="Pilih mata pelajaran"
        {...register("subjectId", { required: "Mata pelajaran wajib dipilih" })}
        options={
          Array.isArray(subjects)
            ? subjects.map((s) => ({ value: s.id, label: s.namaMapel }))
            : []
        }
        error={errors?.subjectId?.message}
      />
    </ModalForm>
  );
}
