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

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      const [res, clsRes, subRes, tutRes] = await Promise.all([
        api.get(`/class-subject-tutors/${id}`),
        api.get("/classes"),
        api.get("/subjects"),
        api.get("/tutors"),
      ]);

      const data = res.data.data;
      reset({
        classId: data.classId,
        subjectId: data.subjectId,
        tutorId: data.tutorId,
      });

      setClasses(clsRes.data.data.classes || []);
      setSubjects(subRes.data.data.subjects || []);
      setTutors(tutRes.data.data.tutors || []);
    } catch (err) {
      toast.error("Gagal memuat data");
    }
  };

  const onSubmit = async (values) => {
    try {
      await api.put(`/class-subject-tutors/${id}`, values);
      toast.success("Data berhasil diperbarui");
      router.push("/admin/class-subject-tutor");
    } catch (err) {
      toast.error("Gagal memperbarui data");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6 space-y-6">
          <PageHeader
            title="Edit Pembagian Jadwal Belajar"
            description="Perbarui data kelas, mata pelajaran, dan tutor."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              {
                label: "Pembagian Jadwal Belajar",
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
                label: cls.namaKelas,
              }))}
              rules={{ required: "Kelas wajib diisi" }}
              error={errors.classId?.message}
            />

            <FormField
              type="select"
              label="Mata Pelajaran"
              name="subjectId"
              control={control}
              placeholder="Pilih Mapel"
              options={subjects.map((sub) => ({
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
