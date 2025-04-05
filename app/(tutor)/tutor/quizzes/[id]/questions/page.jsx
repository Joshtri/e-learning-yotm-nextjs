"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export default function QuizQuestionsPage() {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/tutor/quizzes/${id}`);
        setQuestions(res.data.data.questions || []);
        setQuizTitle(res.data.data.judul || "Detail Kuis");
      } catch (err) {
        toast.error("Gagal memuat soal kuis");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchQuestions();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <PageHeader
        title={`Daftar Soal Kuis`}
        description={`Judul: ${quizTitle}`}
        breadcrumbs={[
          { title: "Kuis", href: "/tutor/quizzes" },
          { title: "Detail Kuis", href: `/tutor/quizzes/${id}` },
          { title: "Soal" },
        ]}
      />

      {loading ? (
        <p>Memuat soal...</p>
      ) : questions.length === 0 ? (
        <p className="text-muted-foreground">Belum ada soal untuk kuis ini.</p>
      ) : (
        <div className="space-y-6">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="border rounded-md p-4 space-y-2 bg-white shadow-sm"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">
                  {i + 1}. {q.teks}
                </h3>
                <Badge variant="outline">{q.jenis.replaceAll("_", " ")}</Badge>
              </div>

              {q.options?.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {q.options.map((opt, idx) => (
                    <li
                      key={opt.id || idx}
                      className={
                        opt.adalahBenar ? "text-green-600 font-medium" : ""
                      }
                    >
                      {opt.teks}
                      {opt.adalahBenar && " (Benar)"}
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-muted-foreground">Poin: {q.poin}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
