"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/form-field"; // 🆕 Import FormField

export default function EditClassSubjectTutorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      classId: "",
      subjectId: "",
      tutorId: "",
    },
  });

  const selectedClassId = watch("classId");

  // Filter subjects berdasarkan program kelas yang dipilih
  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const filteredSubjects = selectedClassId
    ? subjects.filter((s) => s.programId === selectedClass?.programId)
    : [];

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const [res, clsRes, subRes, tutRes] = await Promise.all([
        api.get(`/class-subject-tutors/${id}`),
        api.get("/classes"),
        api.get("/subjects"),
        api.get("/tutors"),
      ]);

      const classesData = clsRes.data.data.classes || [];
      const subjectsData = subRes.data.data.subjects || [];
      const tutorsData = tutRes.data.data.tutors || [];

      setClasses(classesData);
      setSubjects(subjectsData);
      setTutors(tutorsData);

      const data = res.data.data;
      setInitialData(data);

      // Reset form setelah semua data loaded
      reset({
        classId: data.classId || data.class?.id || "",
        subjectId: data.subjectId || data.subject?.id || "",
        tutorId: data.tutorId || data.tutor?.id || "",
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset subjectId ketika classId berubah (kecuali saat initial load)
  useEffect(() => {
    if (!isLoading && initialData && selectedClassId !== initialData.classId) {
      setValue("subjectId", "");
    }
  }, [selectedClassId, isLoading, initialData, setValue]);

  const onSubmit = async (values) => {
    try {
      await api.put(`/class-subject-tutors/${id}`, values);
      toast.success("Data berhasil diperbarui");
      router.push("/admin/class-subject-tutor");
    } catch (err) {
      toast.error("Gagal memperbarui data");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6 space-y-6">
          <PageHeader
            title="Edit Penugasan Tutor"
            description="Perbarui data kelas, mata pelajaran, dan tutor."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              {
                label: "Penugasan Tutor",
                href: "/admin/class-subject-tutor",
              },
              { label: "Edit" },
            ]}
          />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 max-w-xl"
          >
            <FormField
              type="select"
              label="Kelas"
              name="classId"
              control={control}
              placeholder="Pilih Kelas"
              options={classes.map((cls) => ({
                value: cls.id,
                label: `${cls.namaKelas} - ${cls.program?.namaPaket || "Tanpa Program"}`,
              }))}
              rules={{ required: "Kelas wajib diisi" }}
              error={errors.classId?.message}
            />

            <FormField
              type="select"
              label="Mata Pelajaran"
              name="subjectId"
              control={control}
              placeholder={selectedClassId ? "Pilih Mata Pelajaran" : "Pilih Kelas terlebih dahulu"}
              disabled={!selectedClassId}
              options={filteredSubjects.map((sub) => ({
                value: sub.id,
                label: sub.namaMapel,
              }))}
              rules={{ required: "Mapel wajib diisi" }}
              error={errors.subjectId?.message}
            />

            <FormField
              type="select"
              label="Tutor"
              name="tutorId"
              control={control}
              placeholder="Pilih Tutor"
              options={tutors.map((tutor) => ({
                value: tutor.id,
                label: tutor.namaLengkap,
              }))}
              rules={{ required: "Tutor wajib diisi" }}
              error={errors.tutorId?.message}
            />

            <div className="pt-4">
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
