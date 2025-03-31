"use client";

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
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      programId: "",
      subjectId: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await api.post("/program-subjects", data);
      toast.success("Berhasil menambahkan mata pelajaran ke program");
      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Gagal menambahkan program-subject:", err);
      toast.error(err?.response?.data?.message || "Gagal menyimpan data");
    }
  };

  return (
    <ModalForm
      isOpen={open}
      onClose={onClose}
      title="Tambah Mapel ke Program"
      description="Pilih program dan mata pelajaran yang ingin ditambahkan"
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
        {...register("subjectId", { required: "Mata pelajaran wajib dipilih" })}
        options={subjects.map((s) => ({
          value: s.id,
          label: s.namaMapel,
        }))}
        error={errors.subjectId?.message}
      />
    </ModalForm>
  );
}
