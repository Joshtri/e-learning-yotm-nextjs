"use client";

import { useEffect, useRef, useState } from "react";
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
import { FileText, Upload, Eye, AlertTriangle, Clock, Send } from "lucide-react";

export default function AssignmentStartPage() {
  const { id } = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [answerImages, setAnswerImages] = useState({}); // ✅ New state for images
  const [answerFile, setAnswerFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [autoSubmitFailed, setAutoSubmitFailed] = useState(false);

  // Refs so auto-submit callback always reads the latest values
  const answersRef = useRef({});
  const answerImagesRef = useRef({});
  const answerFileRef = useRef(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    answerImagesRef.current = answerImages;
  }, [answerImages]);

  useEffect(() => {
    answerFileRef.current = answerFile;
  }, [answerFile]);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await api.get(`/student/assignments/${id}/start`);
        const { assignment, questions, previousAnswers } = res.data.data;
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

  const handleImageUpload = (questionId, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran gambar maksimal 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnswerImages((prev) => ({ ...prev, [questionId]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (questionId) => {
    setAnswerImages((prev) => {
      const newImages = { ...prev };
      delete newImages[questionId];
      return newImages;
    });
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
    if (timeUp) return;
    setTimeUp(true);
    submitAssignment(true);
  };

  const submitAssignment = async (isAutoSubmit = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      let payload = {};

      if (assignment?.questionsFromPdf && answerFileRef.current) {
        const base64 = await convertFileToBase64(answerFileRef.current);
        payload = { answerPdf: base64 };
      } else {
        payload = {
          answers: questions.map((q) => ({
            questionId: q.id,
            jawaban: answersRef.current[q.id] || "",
            image: answerImagesRef.current[q.id] || null,
          })),
        };
      }

      await api.post(`/student/assignments/${id}/submit`, payload);

      if (isAutoSubmit) {
        toast.success("Waktu habis! Seluruh jawaban berhasil disimpan.", {
          description: "Tugas telah berakhir. Jawaban Anda telah tersimpan.",
          duration: 5000,
        });
      } else {
        toast.success("Jawaban berhasil dikumpulkan!");
      }
      setTimeout(() => router.push("/siswa/assignments/list"), 2500);
    } catch (error) {
      if (isAutoSubmit) {
        setAutoSubmitFailed(true);
        toast.error("Gagal menyimpan jawaban otomatis.", {
          description:
            "Jawaban Anda belum tersimpan. Tekan tombol 'Coba Kirim Ulang'.",
          duration: 8000,
        });
      } else if (error.response?.status === 403) {
        const errorData = error.response.data;
        toast.error(errorData.message);
        router.push("/siswa/assignments/list");
      } else {
        toast.error("Gagal mengumpulkan jawaban");
      }
    } finally {
      isSubmittingRef.current = false;
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

      {/* Time-up notification banner */}
      {timeUp && !autoSubmitFailed && (
        <Card className="mb-6 border-red-400 bg-red-50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <p className="text-lg font-bold text-red-700">
                  Waktu Pengerjaan Telah Berakhir
                </p>
                <p className="text-sm text-red-600">
                  Semua jawaban Anda telah berhasil disimpan secara otomatis.
                  Anda akan dialihkan ke halaman daftar tugas.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-500 shrink-0">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-submit failure recovery panel */}
      {timeUp && autoSubmitFailed && (
        <Card className="mb-6 border-red-400 bg-red-50 shadow-lg">
          <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-sm text-red-700">
                <p className="font-semibold text-base">
                  Gagal Menyimpan Jawaban
                </p>
                <p>
                  Waktu habis, tetapi jawaban Anda belum berhasil terkirim.
                  Jangan tutup halaman ini. Tekan tombol di samping untuk
                  mengirim ulang jawaban Anda.
                </p>
              </div>
            </div>
            <Button
              onClick={() => submitAssignment(true)}
              className="bg-red-600 hover:bg-red-700 shrink-0"
            >
              <Send className="h-4 w-4 mr-2" />
              Coba Kirim Ulang
            </Button>
          </CardContent>
        </Card>
      )}

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
        <div className={`mt-6 space-y-6 ${timeUp ? "opacity-60 pointer-events-none" : ""}`}>
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
                    } catch {
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
                    } catch {
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
        <form className={`mt-6 space-y-6 ${timeUp ? "opacity-60 pointer-events-none" : ""}`}>
          {questions.map((q, i) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle>Soal {i + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {q.teks}
                </p>
                {/* 🖼️ Display Question Image */}
                {q.image && (
                  <div className="mb-4 mt-2">
                    <img
                      src={q.image}
                      alt="Gambar Soal"
                      className="max-w-full h-auto rounded-lg border max-h-96 object-contain"
                    />
                  </div>
                )}
                {/* Multiple Choice */}
                {q.jenis === "MULTIPLE_CHOICE" &&
                  q.options &&
                  q.options.length > 0 && (
                    <div className="space-y-2">
                      {q.options.map((option, optIndex) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="radio"
                            id={`${q.id}-${option.id}`}
                            name={q.id}
                            value={option.id}
                            checked={answers[q.id] === option.id}
                            onChange={(e) => handleChange(q.id, e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <label
                            htmlFor={`${q.id}-${option.id}`}
                            className="flex-1 cursor-pointer p-2 rounded hover:bg-gray-50"
                          >
                            {String.fromCharCode(65 + optIndex)}. {option.teks}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                {/* True/False */}
                {q.jenis === "TRUE_FALSE" && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${q.id}-true`}
                        name={q.id}
                        value="true"
                        checked={answers[q.id] === "true"}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <label
                        htmlFor={`${q.id}-true`}
                        className="flex-1 cursor-pointer p-2 rounded hover:bg-gray-50"
                      >
                        Benar
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${q.id}-false`}
                        name={q.id}
                        value="false"
                        checked={answers[q.id] === "false"}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <label
                        htmlFor={`${q.id}-false`}
                        className="flex-1 cursor-pointer p-2 rounded hover:bg-gray-50"
                      >
                        Salah
                      </label>
                    </div>
                  </div>
                )}
                {/* Short Answer */}
                {q.jenis === "SHORT_ANSWER" && (
                  <Input
                    placeholder="Tulis jawaban singkat Anda"
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                  />
                )}
                {/* Essay */}
                {q.jenis === "ESSAY" && (
                  <Textarea
                    placeholder="Tulis jawaban essay Anda di sini"
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    rows={6}
                  />
                )}

                {/* 📷 Student Answer Image Upload */}
                <div className="mt-4 border-t pt-4">
                  <Label className="text-sm font-medium mb-2 block">
                    Lampirkan Gambar (Opsional)
                  </Label>
                  {answerImages[q.id] ? (
                    <div className="relative w-full max-w-sm rounded-md border p-2">
                      <img
                        src={answerImages[q.id]}
                        alt="Jawaban Siswa"
                        className="w-full h-auto rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => handleRemoveImage(q.id)}
                      >
                        <div className="h-3 w-3 flex items-center justify-center pt-1">
                          x
                        </div>
                      </Button>
                    </div>
                  ) : (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(q.id, e)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </form>
      )}

      {/* Submit Button */}
      <div className="mt-6 text-right">
        <Button
          type="button"
          onClick={() => submitAssignment(false)}
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
