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
    formState: { errors },
  } = useForm({});

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          programId: editData.program?.id || "",
          subjectId: editData.subject?.id || "",
        });
      } else {
        reset({ 
          programId: "",
          subjectId: "",
        });
      }
    }
  }, [editData, open, reset]);

  const onSubmit = async (data) => {
    try {
      if (editData) {
        await api.put(`/program-subjects/${editData.id}`, data);
        toast.success("Berhasil memperbarui data");
      } else {
        await api.post("/program-subjects", data);
        toast.success("Berhasil menambahkan data");
      }

      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Gagal menyimpan data:", err);
      toast.error(err?.response?.data?.message || "Gagal menyimpan data");
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
    >
      <FormField
        label="Program"
        name="programId"
        type="select"
        control={control}
        placeholder="Pilih program"
        {...register("programId", { required: "Program wajib dipilih" })}
        options={programs.map((p) => ({
          value: p.id,
          label: p.namaPaket,
        }))}
        error={errors.programId?.message}
      />

      <FormField
        label="Mata Pelajaran"
        name="subjectId"
        type="select"
        control={control}
        placeholder="Pilih mata pelajaran"
        {...register("subjectId", {
          required: "Mata pelajaran wajib dipilih",
        })}
        options={subjects.map((s) => ({
          value: s.id,
          label: s.namaMapel,
        }))}
        error={errors.subjectId?.message}
      />
    </ModalForm>
  );
}
