"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import StudentForm from "@/components/students/StudentForm";

export default function StudentEditPage() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const router = useRouter();
  const [classOptions, setClassOptions] = useState([]);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/students/${id}`);
        setStudent(res.data.data.student); // 👈 ambil hanya data student
      } catch (error) {
        toast.error("Gagal memuat data siswa");
        router.push("/admin/students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  useEffect(() => {
    const fetchClasses = async () => {
      const res = await api.get("/classes");
      setClassOptions(res.data.data.classes || []);
    };
    fetchClasses();
  }, []);

  const handleUpdate = async (data) => {
    try {
      await api.patch(`/students/${id}`, data);
      toast.success("Siswa berhasil diperbarui");
      router.push("/admin/students");
    } catch (err) {
      toast.error("Gagal memperbarui siswa");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <PageHeader
        title="Edit Siswa"
        description="Ubah data siswa yang terdaftar"
        breadcrumbs={[
          { title: "Siswa", href: "/admin/students" },
          { title: "Edit Siswa" },
        ]}
      />
      {!loading && student && (
        <StudentForm
          defaultValues={student}
          onSubmit={handleUpdate}
          classOptions={classOptions}
        />
      )}
    </div>
  );
}
