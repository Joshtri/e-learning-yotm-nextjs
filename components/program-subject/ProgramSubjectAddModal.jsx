"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import ModalForm from "@/components/ui/modal-form";
import FormField from "@/components/ui/form-field";
import api from "@/lib/axios";

export default function ProgramSubjectAddModal({
  open,
  onClose,
  onSuccess,
  programs = [],
  subjects,
  editData,
}) {
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

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

  const selectedProgramId = useWatch({
    control,
    name: "programId",
  });

  // Effect to fetch subjects when program changes
  useEffect(() => {
    const fetchSubjectsByProgram = async () => {
      if (!selectedProgramId) {
        setSubjectOptions([]);
        return;
      }

      setIsLoadingSubjects(true);
      try {
        // Fetch subjects specific to the selected program (limit=0 for all)
        const res = await api.get("/subjects", {
          params: {
            programId: selectedProgramId,
            limit: 0,
          },
        });

        const fetchedSubjects = res.data.data.subjects || [];
        setSubjectOptions(
          fetchedSubjects.map((s) => ({ value: s.id, label: s.namaMapel })),
        );
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
        toast.error("Gagal memuat daftar mata pelajaran");
        setSubjectOptions([]);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchSubjectsByProgram();
  }, [selectedProgramId]);

  useEffect(() => {
    if (!open) return;
    if (editData) {
      // Set initial values
      reset({
        programId: editData?.program?.id ?? "",
        subjectId: editData?.subject?.id ?? "",
      });
      // Note: The subjects dropdown will be populated by the useWatch effect above
      // once programId is set. But we might need to verify if the current subjectId
      // is valid for the fetched list. For now, we trust the flow.
    } else {
      reset({ programId: "", subjectId: "" });
      setSubjectOptions([]);
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
        placeholder={
          isLoadingSubjects
            ? "Memuat mata pelajaran..."
            : "Pilih mata pelajaran"
        }
        disabled={!selectedProgramId || isLoadingSubjects}
        {...register("subjectId", { required: "Mata pelajaran wajib dipilih" })}
        options={subjectOptions}
        error={errors?.subjectId?.message}
      />
    </ModalForm>
  );
}
