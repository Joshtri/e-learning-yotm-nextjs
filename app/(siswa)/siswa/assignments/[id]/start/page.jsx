"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { LoadingOverlay } from "@/components/ui/loading";
import SkeletonTable from "@/components/ui/skeleton/SkeletonTable";
import { FileText, Upload, Loader2, Eye } from "lucide-react";

export default function AssignmentStartPage() {
  const { id } = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [answerFile, setAnswerFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await api.get(`/student/assignments/${id}/start`);
        const { assignment, questions, previousAnswers, submission } =
          res.data.data;
        setAssignment(assignment);
        setQuestions(questions);
        setAnswers(previousAnswers || {});
      } catch (error) {
        if (error.response?.status === 403) {
          const errorData = error.response.data;
          toast.error(errorData.message);
          router.push("/siswa/assignments/list");
        } else {
          toast.error("Gagal memuat tugas");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id, router]);

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setAnswerFile(file);
    } else {
      toast.error("Hanya file PDF yang diperbolehkan");
      e.target.value = "";
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleTimeUp = () => {
    setTimeUp(true);
    toast.warning("Waktu habis! Jawaban akan dikumpulkan otomatis");
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let payload = {};

      if (assignment?.questionsFromPdf && answerFile) {
        // PDF-based assignment
        const base64 = await convertFileToBase64(answerFile);
        payload = { answerPdf: base64 };
      } else {
        // Traditional question-based assignment
        payload = {
          answers: questions.map((q) => ({
            questionId: q.id,
            jawaban: answers[q.id] || "",
          })),
        };
      }

      await api.post(`/student/assignments/${id}/submit`, payload);
      toast.success("Jawaban berhasil dikumpulkan");
      router.push("/siswa/assignments/list");
    } catch (error) {
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        toast.error(errorData.message);
        router.push("/siswa/assignments/list");
      } else {
        toast.error("Gagal mengumpulkan jawaban");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return <SkeletonTable numRows={5} numCols={4} showHeader={true} />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <LoadingOverlay
        isVisible={isSubmitting}
        message="Mengumpulkan jawaban tugas..."
      />

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

      {/* Countdown Timer */}
      {assignment?.batasWaktuMenit && (
        <div className="mt-6 mb-6">
          <CountdownTimer
            totalMinutes={assignment.batasWaktuMenit}
            onTimeUp={handleTimeUp}
          />
        </div>
      )}

      {assignment?.questionsFromPdf ? (
        /* PDF-based Assignment */
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Soal dalam bentuk PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Silakan unduh dan baca soal, kemudian upload jawaban dalam
                format PDF
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    // Convert base64 to blob and download
                    try {
                      const byteCharacters = atob(
                        assignment.questionsFromPdf.split(",")[1]
                      );
                      const byteNumbers = new Array(byteCharacters.length);
                      for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                      }
                      const byteArray = new Uint8Array(byteNumbers);
                      const blob = new Blob([byteArray], {
                        type: "application/pdf",
                      });

                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `Soal_${assignment.judul}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      toast.error("Gagal mengunduh file PDF");
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Unduh Soal PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Open PDF in new tab
                    try {
                      const newWindow = window.open();
                      newWindow.document.write(`
                        <html>
                          <head>
                            <title>Soal - ${assignment.judul}</title>
                            <style>
                              body { margin: 0; padding: 0; }
                              iframe { width: 100vw; height: 100vh; border: none; }
                            </style>
                          </head>
                          <body>
                            <iframe src="${assignment.questionsFromPdf}" type="application/pdf"></iframe>
                          </body>
                        </html>
                      `);
                    } catch (error) {
                      toast.error("Gagal membuka PDF");
                    }
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PDF Answer Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Jawaban</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="answer-pdf" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium">
                        Upload jawaban dalam format PDF
                      </span>
                    </Label>
                    <Input
                      id="answer-pdf"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {answerFile && (
                    <p className="mt-2 text-sm text-green-600">
                      File terpilih: {answerFile.name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Traditional Question-based Assignment */
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
        </form>
      )}

      {/* Submit Button */}
      <div className="mt-6 text-right">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            timeUp ||
            (assignment?.questionsFromPdf && !answerFile) ||
            (!assignment?.questionsFromPdf &&
              questions.length > 0 &&
              !questions.some((q) => answers[q.id]))
          }
        >
          {isSubmitting ? "Mengirim..." : "Kumpulkan Jawaban"}
        </Button>
      </div>
    </div>
  );
}
