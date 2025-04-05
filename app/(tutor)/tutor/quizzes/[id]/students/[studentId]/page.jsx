"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";

export default function StudentAnswerDetailPage() {
  const { id: quizId, studentId } = useParams(); // ✅ perbaikan disini
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId || !studentId) return;

    const fetchAnswers = async () => {
      try {
        const res = await api.get(
          `/tutor/quizzes/${quizId}/students/${studentId}/answers`
        ); // ✅ perbaikan URL disini
        setAnswers(res.data || []);
      } catch (err) {
        console.error("Gagal memuat jawaban siswa", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnswers();
  }, [quizId, studentId]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Detail Jawaban Siswa"
        description="Lihat jawaban siswa per soal"
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Kuis", href: "/tutor/quizzes" },
          { label: "Jawaban Siswa", href: `/tutor/quizzes/${quizId}/students` },
          { label: "Detail Jawaban" },
        ]}
      />

      {loading ? (
        <p>Memuat jawaban siswa...</p>
      ) : answers.length === 0 ? (
        <p className="text-muted-foreground">
          Siswa belum menjawab soal apa pun.
        </p>
      ) : (
        <div className="space-y-4">
          {answers.map((item, i) => (
            <div
              key={i}
              className="border p-4 rounded shadow-sm bg-white space-y-2"
            >
              <div className="font-semibold">Soal {i + 1}</div>
              <div className="text-sm text-muted-foreground">{item.soal}</div>

              <div className="text-sm">
                <strong>Jawaban:</strong> {item.jawaban || <em>-</em>}
              </div>

              {item.benar !== null && (
                <div
                  className={`text-sm font-medium ${
                    item.benar ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.benar ? "✔️ Jawaban Benar" : "❌ Jawaban Salah"}
                </div>
              )}

              {item.nilai !== null && (
                <div className="text-sm">
                  <strong>Nilai:</strong> {item.nilai}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
