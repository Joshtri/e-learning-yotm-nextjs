// app/tutor/quizzes/[quizId]/students/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function QuizStudentListPage() {
  const { id: quizId } = useParams(); // ambil quizId dari param [id]
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;

    const fetchStudents = async () => {
      try {
        const res = await api.get(`/tutor/quizzes/${quizId}/students`);
        setStudents(res.data || []);
      } catch (err) {
        console.error("Gagal mengambil data siswa", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [quizId]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Jawaban Siswa"
        description="Daftar siswa yang telah mengerjakan kuis ini"
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Kuis", href: "/tutor/quizzes" },
          { label: "Jawaban Siswa" },
        ]}
      />

      {loading ? (
        <p>Memuat data siswa...</p>
      ) : students.length === 0 ? (
        <p className="text-muted-foreground">
          Belum ada siswa yang mengerjakan kuis ini.
        </p>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="border rounded p-4 flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{student.namaLengkap}</div>
                <div className="text-sm text-muted-foreground">
                  {student.user.email}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/tutor/quizzes/${quizId}/students/${student.id}`)
                }
              >
                <Eye className="h-4 w-4 mr-1" />
                Lihat Jawaban
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
