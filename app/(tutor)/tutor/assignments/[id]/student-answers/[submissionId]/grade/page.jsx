"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, CheckCircle, XCircle } from "lucide-react";

export default function GradeSubmissionPage() {
  const { id: assignmentId, submissionId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [student, setStudent] = useState(null);
  const [nilai, setNilai] = useState("");
  const [feedback, setFeedback] = useState("");
  const [answerGrades, setAnswerGrades] = useState({});

  useEffect(() => {
    fetchData();
  }, [submissionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tutor/submissions/${submissionId}`);
      const data = res.data.data.submission;
      setSubmission(data);
      setAssignment(data.assignment);
      setStudent(data.student);
      setNilai(data.nilai || "");
      setFeedback(data.feedback || "");

      // Initialize answer grades
      const grades = {};
      data.answers?.forEach((ans) => {
        grades[ans.id] = {
          nilai: ans.nilai || "",
          feedback: ans.feedback || "",
          adalahBenar: ans.adalahBenar,
        };
      });
      setAnswerGrades(grades);
    } catch (error) {
      console.error("Error fetching submission:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerGradeChange = (answerId, field, value) => {
    setAnswerGrades((prev) => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value,
      },
    }));
  };

  const calculateTotalGrade = () => {
    let total = 0;
    submission.answers?.forEach((ans) => {
      const grade = answerGrades[ans.id];
      if (grade && grade.nilai) {
        total += parseFloat(grade.nilai);
      }
    });
    return total;
  };

  const handleAutoCalculate = () => {
    const total = calculateTotalGrade();
    const maxPoin = assignment.questions?.reduce((sum, q) => sum + q.poin, 0) || 100;

    if (assignment.nilaiMaksimal && maxPoin > 0) {
      const nilaiAkhir = (total / maxPoin) * assignment.nilaiMaksimal;
      setNilai(nilaiAkhir.toFixed(2));
    } else {
      setNilai(total.toFixed(2));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        nilai: nilai ? parseFloat(nilai) : null,
        feedback: feedback || null,
        answers: Object.entries(answerGrades).map(([answerId, grade]) => ({
          answerId,
          nilai: grade.nilai ? parseFloat(grade.nilai) : null,
          feedback: grade.feedback || null,
          adalahBenar: grade.adalahBenar,
        })),
      };

      await api.put(`/tutor/submissions/${submissionId}`, payload);

      toast.success("Penilaian berhasil disimpan");
      router.push(`/tutor/assignments/${assignmentId}/student-answers`);
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error(error.response?.data?.message || "Gagal menyimpan penilaian");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-muted-foreground">Memuat data...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Data tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Beri Nilai"
        description={`Penilaian untuk ${student?.namaLengkap || student?.user?.nama}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor" },
          { label: "Tugas", href: "/tutor/assignments" },
          {
            label: assignment?.judul || "Tugas",
            href: `/tutor/assignments/${assignmentId}/student-answers`,
          },
          { label: "Beri Nilai" },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push(`/tutor/assignments/${assignmentId}/student-answers`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informasi Pengerjaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Siswa</Label>
              <p className="font-medium">
                {student?.namaLengkap || student?.user?.nama}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">NISN</Label>
              <p>{student?.nisn || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Waktu Kumpul</Label>
              <p>
                {submission.waktuKumpul
                  ? new Date(submission.waktuKumpul).toLocaleString("id-ID")
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {assignment?.questions && assignment.questions.length > 0 && (
          <div className="space-y-4">
            {assignment.questions.map((question, index) => {
              const answer = submission.answers?.find(
                (ans) => ans.questionId === question.id
              );

              if (!answer) return null;

              const grade = answerGrades[answer.id] || {};

              return (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Soal {index + 1}{" "}
                      <Badge variant="outline" className="ml-2">
                        {question.jenis.replace("_", " ")}
                      </Badge>
                      <span className="ml-2 text-sm text-muted-foreground">
                        (Maks: {question.poin} poin)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{question.teks}</p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                      <Label className="text-blue-900 dark:text-blue-100">
                        Jawaban Siswa:
                      </Label>
                      <div className="mt-2 flex items-start gap-2">
                        {grade.adalahBenar !== null && (
                          <div className="mt-1">
                            {grade.adalahBenar ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        )}
                        <p className="text-blue-800 dark:text-blue-200 font-medium">
                          {answer.jawaban}
                        </p>
                      </div>
                    </div>

                    {question.jawabanBenar && (
                      <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded">
                        <Label className="text-green-900 dark:text-green-100">
                          Kunci Jawaban:
                        </Label>
                        <p className="text-green-800 dark:text-green-200 mt-1">
                          {question.jawabanBenar}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <Label htmlFor={`nilai-${answer.id}`}>
                          Nilai (Maks: {question.poin})
                        </Label>
                        <Input
                          id={`nilai-${answer.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          max={question.poin}
                          value={grade.nilai || ""}
                          onChange={(e) =>
                            handleAnswerGradeChange(answer.id, "nilai", e.target.value)
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`feedback-${answer.id}`}>
                          Feedback Jawaban
                        </Label>
                        <Input
                          id={`feedback-${answer.id}`}
                          value={grade.feedback || ""}
                          onChange={(e) =>
                            handleAnswerGradeChange(
                              answer.id,
                              "feedback",
                              e.target.value
                            )
                          }
                          placeholder="Feedback untuk jawaban ini..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={handleAutoCalculate}>
                Hitung Otomatis Nilai Total
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Penilaian Akhir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nilai">
                Nilai Akhir{" "}
                {assignment?.nilaiMaksimal && `(Maksimal: ${assignment.nilaiMaksimal})`}
              </Label>
              <Input
                id="nilai"
                type="number"
                step="0.01"
                min="0"
                max={assignment?.nilaiMaksimal || undefined}
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder="Masukkan nilai akhir..."
                className="max-w-xs"
                required
              />
              {assignment?.questions && assignment.questions.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Total poin jawaban: {calculateTotalGrade().toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="feedback">Feedback Keseluruhan</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Berikan feedback untuk siswa..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/tutor/assignments/${assignmentId}/student-answers`)}
            disabled={saving}
          >
            Batal
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Penilaian"}
          </Button>
        </div>
      </form>
    </div>
  );
}
