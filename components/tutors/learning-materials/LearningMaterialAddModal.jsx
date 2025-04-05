"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import ModalForm from "@/components/ui/modal-form";
import FormField from "@/components/ui/form-field";
import api from "@/lib/axios";

export default function LearningMaterialAddModal({
  open,
  onClose,
  onSuccess,
  defaultClassSubjectTutorId = "",
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      judul: "",
      konten: "",
      file: null,
      classSubjectTutorId: defaultClassSubjectTutorId || "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classSubjectOptions, setClassSubjectOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    // Set the default class subject tutor ID when it changes
    if (defaultClassSubjectTutorId) {
      setValue("classSubjectTutorId", defaultClassSubjectTutorId);
    }
  }, [defaultClassSubjectTutorId, setValue]);

  useEffect(() => {
    const fetchClassSubjects = async () => {
      if (!open) return; // hanya fetch saat modal dibuka

      // Skip fetching options if we already have a default value
      if (defaultClassSubjectTutorId) {
        return;
      }

      setLoadingOptions(true);
      try {
        const res = await api.get("/class-subject-tutors");
        const options = res.data.data.map((cst) => ({
          value: cst.id,
          label: `${cst.class.namaKelas} - ${cst.subject.namaMapel}`,
        }));
        setClassSubjectOptions(options);
      } catch (err) {
        toast.error("Gagal memuat daftar kelas dan mapel");
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchClassSubjects();
  }, [open, defaultClassSubjectTutorId]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      let fileUrl = null;

      if (data.file && data.file[0]) {
        const file = data.file[0];
        const storageRef = ref(storage, `materials/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
      }

      const payload = {
        judul: data.judul,
        konten: data.konten,
        fileUrl,
        classSubjectTutorId:
          data.classSubjectTutorId || defaultClassSubjectTutorId,
      };

      await api.post("/tutor/learning-materials", payload);

      toast.success("Materi berhasil ditambahkan");
      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Gagal upload materi:", err);
      toast.error("Gagal menyimpan materi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalForm
      isOpen={open}
      onClose={onClose}
      title="Tambah Materi Pembelajaran"
      description="Silakan isi data materi yang ingin diunggah."
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <FormField
        label="Judul"
        name="judul"
        type="text"
        control={control}
        placeholder="Contoh: Pengantar Matematika"
        {...register("judul", { required: "Judul wajib diisi" })}
        error={errors.judul?.message}
      />

      <FormField
        label="Konten Materi"
        name="konten"
        type="textarea"
        control={control}
        placeholder="Tuliskan deskripsi atau isi materi"
        {...register("konten")}
        error={errors.konten?.message}
      />

      {!defaultClassSubjectTutorId && (
        <FormField
          label="Kelas & Mapel"
          name="classSubjectTutorId"
          type="select"
          control={control}
          {...register("classSubjectTutorId", {
            required: "Pilih kelas dan mapel",
          })}
          options={classSubjectOptions}
          loading={loadingOptions}
          error={errors.classSubjectTutorId?.message}
        />
      )}

      <FormField
        label="Upload File (Opsional)"
        name="file"
        control={control}
        type="file"
        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        {...register("file")}
      />
    </ModalForm>
  );
}
