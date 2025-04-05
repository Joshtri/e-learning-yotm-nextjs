"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function StudentQuizListPage() {
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/student/quizzes");
        setQuizzes(res.data.data || []);
      } catch (err) {
        toast.error("Gagal memuat kuis");
      }
    };
    fetch();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      <PageHeader
        title="Kuis Aktif"
        description="Berikut daftar kuis yang sedang tersedia untuk kamu"
        breadcrumbs={[
          { title: "Kuis", href: "/siswa/quizzes" },
          { title: "Aktif", href: "/siswa/quizzes/active" },
        ]}
      />

      {quizzes.length === 0 ? (
        <p className="text-muted-foreground">Tidak ada kuis aktif saat ini.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardContent className="p-4 space-y-2">
                <div className="text-lg font-semibold">{quiz.judul}</div>
                <div className="text-sm text-muted-foreground">
                  Mapel: {quiz.classSubjectTutor.subject.namaMapel}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tutor: {quiz.classSubjectTutor.tutor.namaLengkap}
                </div>
                <div className="text-xs text-muted-foreground">
                  Waktu: {new Date(quiz.waktuMulai).toLocaleString("id-ID")} -{" "}
                  {new Date(quiz.waktuSelesai).toLocaleString("id-ID")}
                </div>

                {/* ✅ Button Mulai Kuis */}
                <div className="pt-2">
                  {quiz.sudahDikerjakan ? (
                    <span className="text-sm text-green-600 font-medium">
                      ✅ Sudah dikerjakan (Nilai : {quiz.submissions[0]?.nilai ?? 0})
                    </span>
                  ) : (
                    <Link href={`/siswa/quizzes/${quiz.id}/start`}>
                      <Button size="sm">Mulai Kuis</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
