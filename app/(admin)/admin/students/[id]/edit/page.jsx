"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import StudentForm from "@/components/students/StudentForm";
import { Button } from "@/components/ui/button";

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
      const msg = err.response?.data?.message || err.message || "";
      if (
        msg.toLowerCase().includes("unique") ||
        msg.toLowerCase().includes("exist")
      ) {
        toast.error("NIS atau NISN sudah digunakan oleh siswa lain.");
      } else {
        toast.error("Gagal memperbarui siswa");
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus siswa ini?")) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success("Siswa berhasil dihapus");
      router.push("/admin/students");
    } catch (error) {
      console.error("Failed to delete student:", error);
      toast.error("Gagal menghapus siswa");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <PageHeader
        title="Edit Siswa"
        description="Ubah data siswa yang terdaftar"
        breadcrumbs={[
          { label: "Siswa", href: "/admin/students" },
          { label: "Edit Siswa" },
        ]}
        actions={
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Siswa
          </Button>
        }
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
