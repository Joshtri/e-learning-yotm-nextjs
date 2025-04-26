"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function QuizDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/tutor/quizzes/${id}`);
        setQuiz(res.data.data);
      } catch (error) {
        toast.error("Gagal memuat detail kuis");
        router.push("/tutor/quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, router]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    );
  }

  if (!quiz) return null;

  const {
    judul,
    deskripsi,
    waktuMulai,
    waktuSelesai,
    durasiMenit,
    nilaiMaksimal,
    questions,
    classSubjectTutor,
  } = quiz;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={judul}
        description="Detail informasi mengenai kuis ini"
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Kuis", href: "/tutor/quizzes" },
          { label: "Detail" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Informasi Kuis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Deskripsi:</strong>
            <p className="text-muted-foreground">{deskripsi || "-"}</p>
          </div>
          <div>
            <strong>Kelas & Mapel:</strong>
            <p>
              {classSubjectTutor?.class?.namaKelas || "-"} -{" "}
              {classSubjectTutor?.subject?.namaMapel || "-"}
            </p>
          </div>
          <div>
            <strong>Tutor:</strong>
            <p>{classSubjectTutor?.tutor?.namaLengkap || "-"}</p>
          </div>
          <div>
            <strong>Waktu:</strong>
            <p>
              {new Date(waktuMulai).toLocaleString("id-ID")} -{" "}
              {new Date(waktuSelesai).toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <strong>Durasi:</strong> {durasiMenit} menit
          </div>
          <div>
            <strong>Nilai Maksimal:</strong> {nilaiMaksimal}
          </div>
          <div>
            <strong>Jumlah Soal:</strong>{" "}
            <Badge variant="outline">{questions.length} soal</Badge>
          </div>
          <div>
            <strong>Acak Soal:</strong>{" "}
            <Badge variant="secondary">{quiz.acakSoal ? "Ya" : "Tidak"}</Badge>
          </div>
          <div>
            <strong>Acak Jawaban:</strong>{" "}
            <Badge variant="secondary">
              {quiz.acakJawaban ? "Ya" : "Tidak"}
            </Badge>
          </div>
          <div>
            <strong>Dibuat Pada:</strong>{" "}
            {new Date(quiz.createdAt).toLocaleString("id-ID")}
          </div>
          <div>
            <strong>Terakhir Diperbarui:</strong>{" "}
            {new Date(quiz.updatedAt).toLocaleString("id-ID")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
