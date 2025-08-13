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
      pertemuan: "",
      konten: "",
      file: null,
      classSubjectTutorId: defaultClassSubjectTutorId || "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classSubjectOptions, setClassSubjectOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (defaultClassSubjectTutorId) {
      setValue("classSubjectTutorId", defaultClassSubjectTutorId);
    }
  }, [defaultClassSubjectTutorId, setValue]);

  useEffect(() => {
    const fetchClassSubjects = async () => {
      if (!open) return;
      if (defaultClassSubjectTutorId) return;

      setLoadingOptions(true);
      try {
        const res = await api.get("/class-subject-tutors",);
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

      if (selectedFile) {
        const isPDF =
          selectedFile.type === "application/pdf" ||
          selectedFile.name?.toLowerCase().endsWith(".pdf");

        if (!isPDF) {
          toast.error("Hanya file PDF yang diperbolehkan");
          setIsSubmitting(false);
          return;
        }

        if (selectedFile.size > 3 * 1024 * 1024) {
          toast.error("Ukuran file maksimal 3MB");
          setIsSubmitting(false);
          return;
        }

        const storageRef = ref(
          storage,
          `materials/${Date.now()}_${selectedFile.name}`
        );
        await uploadBytes(storageRef, selectedFile);
        fileUrl = await getDownloadURL(storageRef);
      }

      const payload = {
        judul: data.judul,
        pertemuan: data.pertemuan || "1", // Default ke "1" jika tidak ada
        konten: data.konten,
        fileUrl,
        classSubjectTutorId:
          data.classSubjectTutorId || defaultClassSubjectTutorId,
      };

      await api.post("/tutor/learning-materials", payload);

      toast.success("Materi berhasil ditambahkan");
      reset();
      setSelectedFile(null);
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
        label="Pertemuan"
        name="pertemuan"
        type="text"
        control={control}
        placeholder="Contoh: Pertemuan 1"
        {...register("pertemuan", { required: "Pertemuan wajib diisi" })}
        error={errors.pertemuan?.message}
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

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload File (PDF, max 3MB)
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
        />
      </div>
    </ModalForm>
  );
}
