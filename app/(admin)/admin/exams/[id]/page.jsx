"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";

export default function ExamDetailPage() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExam = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/exams/${id}`);
      setExam(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data ujian");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchExam();
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
        title={exam?.judul || "Detail Ujian"}
        description="Informasi lengkap tentang ujian dan hasil siswa"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Ujian", href: "/admin/exams" },
          { label: exam?.judul || "..." },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Info Ujian</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p>
            <b>Jenis:</b> {exam?.jenis}
          </p>
          <p>
            <b>Kelas:</b> {exam?.classSubjectTutor?.class?.namaKelas}
          </p>
          <p>
            <b>Mapel:</b> {exam?.classSubjectTutor?.subject?.namaMapel}
          </p>
          <p>
            <b>Tutor:</b> {exam?.classSubjectTutor?.tutor?.namaLengkap}
          </p>
          <p>
            <b>Waktu Aktif:</b>{" "}
            {new Date(exam?.TanggalMulai).toLocaleString("id-ID")} -{" "}
            {new Date(exam?.TanggalSelesai).toLocaleString("id-ID")}
          </p>
          <p>
            <b>Nilai Maksimal:</b> {exam?.nilaiMaksimal}
          </p>
          <p>
            <b>Jumlah Soal:</b> {exam?.questions?.length || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hasil Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={exam?.submissions || []}
            columns={studentColumns}
            isLoading={isLoading}
            loadingMessage="Memuat data siswa..."
            emptyMessage="Belum ada siswa mengerjakan ujian ini"
            keyExtractor={(item) => item.studentId}
          />
        </CardContent>
      </Card>
    </main>
  );
}
