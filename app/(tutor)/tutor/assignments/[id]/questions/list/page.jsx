"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssignmentQuestionsViewPage() {
  const { id } = useParams(); // assignmentId
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentRes, questionsRes] = await Promise.all([
          api.get(`/tutor/assignments/${id}`),
          api.get(`/tutor/assignments/${id}/questions`),
        ]);
        setAssignment(assignmentRes.data.data);
        setQuestions(questionsRes.data.data || []);
      } catch (error) {
        toast.error("Gagal memuat data");
      }
    };
    fetchData();
  }, [id]);

  if (!assignment) return <div className="p-6">Memuat...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Daftar Soal: ${assignment.judul}`}
        description={`${assignment.classSubjectTutor.class.namaKelas} - ${assignment.classSubjectTutor.subject.namaMapel}`}
        breadcrumbs={[
          { label: "Tugas", href: "/tutor/assignments" },
          { label: assignment.judul, href: `/tutor/assignments/${id}` },
          { label: "Daftar Soal" },
        ]}
      />

      <div className="space-y-6 mt-6">
        {questions.length === 0 ? (
          <div className="text-muted-foreground">Belum ada soal.</div>
        ) : (
          questions.map((q, index) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle>Soal #{index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>Pertanyaan:</strong>
                  <br />
                  {q.teks}
                </p>
                <p>
                  <strong>Jenis:</strong> {q.jenis}
                </p>
                {q.poin && (
                  <p>
                    <strong>Poin:</strong> {q.poin}
                  </p>
                )}
                {q.pembahasan && (
                  <p>
                    <strong>Pembahasan:</strong>
                    <br />
                    {q.pembahasan}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
