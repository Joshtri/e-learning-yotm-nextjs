"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import api from "@/lib/axios";
import ModalForm from "@/components/ui/modal-form";
import FormField from "@/components/ui/form-field";

export default function DiscussionRoomModal({
  open,
  onClose,
  onSuccess,
  classSubjectTutorId,
  className,
  subject,
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const payload = {
        title: data.title,
        description: data.description,
        classSubjectTutorId,
      };

      await api.post("/tutor/discussion-rooms", payload);

      toast.success("Ruang diskusi berhasil dibuat");
      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Gagal membuat ruang diskusi:", err);
      toast.error("Gagal membuat ruang diskusi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalForm
      isOpen={open}
      onClose={onClose}
      title="Buat Ruang Diskusi Baru"
      description={`Untuk kelas ${className} - ${subject}`}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <FormField
        label="Judul"
        name="title"
        type="text"
        control={control}
        placeholder="Contoh: Diskusi Materi Bab 1"
        {...register("title", { required: "Judul wajib diisi" })}
        error={errors.title?.message}
      />

      <FormField
        label="Deskripsi (Opsional)"
        name="description"
        type="textarea"
        control={control}
        placeholder="Deskripsi singkat tentang ruang diskusi ini"
        {...register("description")}
        error={errors.description?.message}
      />
    </ModalForm>
  );
}
