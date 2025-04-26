"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";

export default function QuizDetailPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuiz = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/quizzes/${id}`);
      setQuiz(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data kuis");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchQuiz();
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
  ]

  return (
    <main className="p-6 space-y-6">
      <PageHeader
        title={quiz?.judul || "Detail Kuis"}
        description="Informasi lengkap tentang kuis dan hasil siswa"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Kuis", href: "/admin/quizzes" },
          { label: quiz?.judul || "..." },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Info Kuis</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p>
            <b>Jenis:</b> {quiz?.jenis}
          </p>
          <p>
            <b>Kelas:</b> {quiz?.classSubjectTutor?.class?.namaKelas}
          </p>
          <p>
            <b>Mapel:</b> {quiz?.classSubjectTutor?.subject?.namaMapel}
          </p>
          <p>
            <b>Tutor:</b> {quiz?.classSubjectTutor?.tutor?.namaLengkap}
          </p>
          <p>
            <b>Waktu Aktif:</b>{" "}
            {new Date(quiz?.waktuMulai).toLocaleString("id-ID")} -{" "}
            {new Date(quiz?.waktuSelesai).toLocaleString("id-ID")}
          </p>
          <p>
            <b>Nilai Maksimal:</b> {quiz?.nilaiMaksimal}
          </p>
          <p>
            <b>Jumlah Soal:</b> {quiz?.jumlahSoal}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hasil Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={quiz?.submissions || []} // ⬅️ ini yang benar
            columns={studentColumns}
            isLoading={isLoading}
            loadingMessage="Memuat data siswa..."
            emptyMessage="Belum ada siswa mengerjakan kuis ini"
            keyExtractor={(item) => item.studentId}
          />
        </CardContent>
      </Card>
    </main>
  );
}
