"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssignmentStartPage() {
  const { id } = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await api.get(`/student/assignments/${id}/start`);
        const { assignment, questions, previousAnswers, submission } = res.data.data;
        setAssignment(assignment);
        setQuestions(questions);
        setAnswers(previousAnswers || {});
        
      } catch {
        toast.error("Gagal memuat tugas");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        answers: questions.map((q) => ({
          questionId: q.id,
          jawaban: answers[q.id] || "",
        })),
      };

      await api.post(`/student/assignments/${id}/submit`, payload);
      toast.success("Jawaban berhasil dikumpulkan");
      router.push("/siswa/assignments/list");
    } catch (error) {
      toast.error("Gagal mengumpulkan jawaban");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Memuat...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Pengerjaan Tugas: ${assignment?.judul}`}
        description={`${
          assignment?.classSubjectTutor?.class?.namaKelas || "-"
        } - ${assignment?.classSubjectTutor?.subject?.namaMapel || "-"}`}
        breadcrumbs={[
          { label: "Tugas", href: "/siswa/assignments/list" },
          { label: "Pengerjaan Tugas" },
        ]}
      />

      <form className="mt-6 space-y-6">
        {questions.map((q, i) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle>Soal {i + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground">{q.teks}</p>
              <Textarea
                placeholder="Tulis jawaban Anda di sini"
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            </CardContent>
          </Card>
        ))}

        <div className="text-right">
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Mengirim..." : "Kumpulkan Jawaban"}
          </Button>
        </div>
      </form>
    </div>
  );
}
