"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import ModalForm from "@/components/ui/modal-form";
import FormField from "@/components/ui/form-field";
import api from "@/lib/axios";

const YT_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=[\w-]{11}|youtu\.be\/[\w-]{11})([^\s]*)?$/i;

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
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      judul: "",
      pertemuan: "",
      konten: "",
      file: null,
      youtubeUrl: "",
      tipeMateri: "FILE", // <-- default
      classSubjectTutorId: defaultClassSubjectTutorId || "",
    },
  });

  const tipeMateri = watch("tipeMateri");

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
        const res = await api.get("/class-subject-tutors");
        const options = (res.data.data || []).map((cst) => ({
          value: cst.id,
          label: `${cst.class.namaKelas} - ${cst.subject.namaMapel}`,
        }));
        setClassSubjectOptions(options);
      } catch {
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

      if (data.tipeMateri === "LINK_YOUTUBE") {
        const url = (data.youtubeUrl || "").trim();
        if (!url || !YT_REGEX.test(url)) {
          toast.error("Masukkan URL YouTube yang valid");
          setIsSubmitting(false);
          return;
        }
        fileUrl = url; // kita simpan ke field fileUrl agar konsisten
      } else {
        // FILE
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
      }

      const payload = {
        judul: data.judul,
        pertemuan: data.pertemuan || "1",
        konten: data.konten || "",
        fileUrl, // untuk YT kita isi dengan youtubeUrl
        tipeMateri: data.tipeMateri, // <-- penting
        classSubjectTutorId:
          data.classSubjectTutorId || defaultClassSubjectTutorId,
      };

      await api.post("/tutor/learning-materials", payload);

      toast.success("Materi berhasil ditambahkan");
      reset();
      setSelectedFile(null);
      onClose();
      onSuccess?.();
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
      {/* Tipe Materi */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Tipe Materi</label>
        <div className="flex gap-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              value="FILE"
              {...register("tipeMateri")}
              defaultChecked
            />
            <span>File (PDF)</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              value="LINK_YOUTUBE"
              {...register("tipeMateri")}
            />
            <span>Link YouTube</span>
          </label>
        </div>
      </div>

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
        placeholder="Contoh: 1"
        {...register("pertemuan")}
        error={errors.pertemuan?.message}
      />

      <FormField
        label="Konten Materi (opsional)"
        name="konten"
        type="textarea"
        control={control}
        placeholder="Deskripsi materi / catatan"
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

      {tipeMateri === "FILE" ? (
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
      ) : (
        <FormField
          label="YouTube URL"
          name="youtubeUrl"
          type="text"
          control={control}
          placeholder="https://youtu.be/xxxxxxxxxxx"
          {...register("youtubeUrl", {
            required: "URL YouTube wajib diisi",
            validate: (v) =>
              !v || YT_REGEX.test(v) || "URL YouTube tidak valid",
          })}
          error={errors.youtubeUrl?.message}
        />
      )}
    </ModalForm>
  );
}
