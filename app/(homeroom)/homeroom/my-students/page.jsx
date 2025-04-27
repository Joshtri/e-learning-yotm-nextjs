// app/(homeroom)/homeroom/my-students/page.jsx

"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // pastikan sudah ada

export default function MyStudentsPage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/homeroom/my-students");
      setStudents(res.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data siswa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Lengkap",
      cell: (row) => row.namaLengkap,
    },
    {
      header: "NISN",
      cell: (row) => row.nisn || "-",
    },
    {
      header: "Jenis Kelamin",
      cell: (row) => (row.jenisKelamin === "MALE" ? "Laki-laki" : "Perempuan"),
    },
    {
      header: "Tanggal Lahir",
      cell: (row) =>
        row.tanggalLahir
          ? new Date(row.tanggalLahir).toLocaleDateString("id-ID")
          : "-",
    },
    {
      header: "Status",
      cell: (row) => {
        return (
          <span className="text-sm">
            {row.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Siswa Saya"
        description="Daftar siswa yang berada di kelas Anda sebagai wali kelas."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Siswa Saya" },
        ]}
      />

      {students.length > 0 ? (
        <DataTable
          data={students}
          columns={columns}
          isLoading={isLoading}
          loadingMessage="Memuat siswa..."
          emptyMessage="Tidak ada siswa di kelas Anda."
          keyExtractor={(item) => item.id}
        />
      ) : (
        <EmptyState
          title="Belum ada siswa"
          description="Saat ini belum ada siswa di kelas Anda."
          icon={<GraduationCap className="h-8 w-8 text-muted-foreground" />}
        />
      )}
    </div>
  );
}
