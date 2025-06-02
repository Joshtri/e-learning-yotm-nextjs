"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssignment = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/assignments/${id}`);
      setAssignment(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data tugas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAssignment();
  }, [id]);

  const studentColumns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Siswa",
      cell: (row) => row.student?.namaLengkap || "-",
    },
    {
      header: "Email",
      cell: (row) => row.student?.user?.email || "-",
    },
    {
      header: "Nilai",
      cell: (row) => row.nilai ?? "-",
    },
    {
      header: "Status",
      cell: (row) => row.status || "-",
    },
    
  ];

  return (
    <main className="p-6 space-y-6">
      <PageHeader
        title={assignment?.judul || "Detail Tugas"}
        description="Informasi lengkap tentang tugas dan hasil siswa"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Tugas", href: "/admin/assignments" },
          { label: assignment?.judul || "..." },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Info Tugas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p>
            <b>Jenis:</b> {assignment?.jenis}
          </p>
          <p>
            <b>Kelas:</b> {assignment?.classSubjectTutor?.class?.namaKelas}
          </p>
          <p>
            <b>Mapel:</b> {assignment?.classSubjectTutor?.subject?.namaMapel}
          </p>
          <p>
            <b>Tutor:</b> {assignment?.classSubjectTutor?.tutor?.namaLengkap}
          </p>
          <p>
            <b>Waktu Aktif:</b>{" "}
            {new Date(assignment?.waktuMulai).toLocaleString("id-ID")} -{" "}
            {new Date(assignment?.waktuSelesai).toLocaleString("id-ID")}
          </p>
          <p>
            <b>Nilai Maksimal:</b> {assignment?.nilaiMaksimal}
          </p>
          <p>
            <b>Jumlah Soal:</b> {assignment?.questions?.length || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hasil Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={assignment?.submissions || []}
            columns={studentColumns}
            isLoading={isLoading}
            loadingMessage="Memuat data siswa..."
            emptyMessage="Belum ada siswa mengerjakan tugas ini"
            keyExtractor={(item) => item.studentId}
          />
        </CardContent>
      </Card>
    </main>
  );
}
