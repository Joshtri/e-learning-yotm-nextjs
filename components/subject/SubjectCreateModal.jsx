"use client"

import { useForm } from "react-hook-form"
import { toast } from "sonner"
import ModalForm from "@/components/ui/modal-form"
import FormField from "@/components/ui/form-field"
import api from "@/lib/axios"

export default function SubjectCreateModal({ open, onClose, onSuccess }) {
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
    },
  })

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        namaMapel: data.namaMapel.trim(),
        deskripsi: data.deskripsi?.trim() || null,
      }

      const res = await api.post("/subjects", payload)

      if (res.data.success) {
        toast.success("Mata pelajaran berhasil ditambahkan")
        reset()
        onClose()
        if (onSuccess) onSuccess()
      } else {
        throw new Error(res.data.message || "Gagal menambahkan mapel")
      }
    } catch (err) {
      console.error("Gagal tambah mapel:", err)
      toast.error(err.response?.data?.message || err.message)
    }
  }

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
    </ModalForm>
  )
}
