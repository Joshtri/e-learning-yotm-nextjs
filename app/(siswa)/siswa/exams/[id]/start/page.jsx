"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FormField from "@/components/ui/form-field";
import { CheckCircle, Circle, ArrowLeft, ArrowRight, Send } from "lucide-react";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { LoadingOverlay } from "@/components/ui/loading";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function StudentExamStartPage() {
  const { id: examId } = useParams();
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [examInfo, setExamInfo] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerImages, setAnswerImages] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [timeUp, setTimeUp] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [autoSubmitFailed, setAutoSubmitFailed] = useState(false);

  const { setValue, watch, control } = useForm({
    defaultValues: { answers: {} },
  });

  const watchedAnswers = watch("answers");

  // Refs so auto-submit callback always reads the latest values
  const watchedAnswersRef = useRef({});
  const answerImagesRef = useRef({});
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    watchedAnswersRef.current = watchedAnswers;
  }, [watchedAnswers]);

  useEffect(() => {
    answerImagesRef.current = answerImages;
  }, [answerImages]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/student/exams/${examId}`);
        setQuestions(res.data.data.questions);
        setExamInfo(res.data.data.exam);
      } catch {
        toast.error("Gagal memuat soal");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [examId]);

  const handleAnswerChange = (questionId, value) => {
    setValue(`answers.${questionId}`, value);
  };

  const handleImageUpload = (questionId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAnswerImages((prev) => ({ ...prev, [questionId]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (questionId) => {
    setAnswerImages((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const isQuestionAnswered = (questionId) => {
    const hasText =
      watchedAnswers[questionId] !== undefined &&
      watchedAnswers[questionId] !== "";
    const hasImage = answerImages[questionId] !== undefined;
    return hasText || hasImage;
  };

  const getUnansweredQuestions = () =>
    questions.filter((q) => !isQuestionAnswered(q.id));

  const calculateProgress = () => {
    if (!questions.length) return 0;
    return (questions.filter((q) => isQuestionAnswered(q.id)).length / questions.length) * 100;
  };

  const submitExam = async (isAutoSubmit = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      await api.post(`/student/exams/${examId}/submit`, {
        answers: watchedAnswersRef.current,
        answerImages: answerImagesRef.current,
      });

      if (isAutoSubmit) {
        toast.success("Waktu habis! Seluruh jawaban berhasil disimpan.", {
          description: "Ujian telah berakhir. Jawaban Anda telah tersimpan.",
          duration: 5000,
        });
      } else {
        toast.success("Jawaban berhasil dikumpulkan!");
      }
      setTimeout(() => router.push("/siswa/exams"), 2500);
    } catch {
      if (isAutoSubmit) {
        setAutoSubmitFailed(true);
        toast.error("Gagal menyimpan jawaban otomatis.", {
          description:
            "Jawaban Anda belum tersimpan. Tekan tombol 'Coba Kirim Ulang'.",
          duration: 8000,
        });
      } else {
        toast.error("Gagal mengirim jawaban");
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleTimeUp = () => {
    if (timeUp) return;
    setTimeUp(true);
    submitExam(true);
  };

  const handleSubmitClick = () => {
    const unanswered = getUnansweredQuestions();
    if (unanswered.length > 0) {
      toast.warning(`Masih ada ${unanswered.length} soal yang belum dijawab`, {
        description:
          "Jawab semua soal terlebih dahulu sebelum mengumpulkan ujian.",
        duration: 5000,
      });
      const firstIdx = questions.findIndex((q) => !isQuestionAnswered(q.id));
      if (firstIdx >= 0) setCurrentIndex(firstIdx);
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    setIsManualSubmitting(true);
    await submitExam(false);
    setIsManualSubmitting(false);
  };

  const goToNextQuestion = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const goToPreviousQuestion = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Memuat...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const isEssay = currentQuestion?.jenis === "ESSAY";
  const isMultipleChoice = currentQuestion?.jenis === "MULTIPLE_CHOICE";
  const isTrueFalse = currentQuestion?.jenis === "TRUE_FALSE";

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <LoadingOverlay
        isVisible={isManualSubmitting}
        message="Mengirim jawaban ujian..."
      />

      {/* Auto-submit failure recovery panel */}
      {timeUp && autoSubmitFailed && (
        <Card className="mb-6 border-red-400 bg-red-50">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-red-700">
              <p className="font-semibold">
                Waktu habis, tetapi jawaban Anda belum berhasil terkirim.
              </p>
              <p>
                Jangan tutup halaman ini. Tekan tombol di samping untuk
                mengirim ulang jawaban Anda.
              </p>
            </div>
            <Button
              onClick={() => submitExam(true)}
              className="bg-red-600 hover:bg-red-700 shrink-0"
            >
              <Send className="h-4 w-4 mr-2" />
              Coba Kirim Ulang
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{examInfo?.judul || "Ujian"}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {examInfo?.subject?.nama || ""}
          </div>
        </CardHeader>
        <CardContent>
          {examInfo?.batasWaktuMenit && (
            <div className="mb-4">
              <CountdownTimer
                totalMinutes={examInfo.batasWaktuMenit}
                onTimeUp={handleTimeUp}
              />
            </div>
          )}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progres</span>
              <span>{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar soal */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daftar Soal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 md:grid-cols-3 gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`flex items-center justify-center h-10 w-10 rounded-full border ${
                      currentIndex === index
                        ? "border-primary bg-primary text-primary-foreground"
                        : isQuestionAnswered(question.id)
                        ? "border-green-500 bg-green-100 text-green-700"
                        : "border-gray-300 bg-background"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-green-100 border border-green-500"></div>
                  <span>Sudah dijawab</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-background border border-gray-300"></div>
                  <span>Belum dijawab</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Konten soal */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">
                  Soal {currentIndex + 1} dari {questions.length}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {isQuestionAnswered(currentQuestion.id) ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" /> Sudah dijawab
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600">
                      <Circle className="h-4 w-4 mr-1" /> Belum dijawab
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-lg font-medium">
                  {currentQuestion.teks}
                </div>

                {currentQuestion.image && (
                  <div className="my-2">
                    <img
                      src={currentQuestion.image}
                      alt="Gambar Soal"
                      className="max-w-full h-auto rounded-md border max-h-96 object-contain"
                    />
                  </div>
                )}

                {isMultipleChoice &&
                  currentQuestion.options?.map((opt) => (
                    <label
                      key={opt.kode}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        watchedAnswers[currentQuestion.id] === opt.kode
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      } cursor-pointer transition-colors`}
                    >
                      <div
                        className={`flex items-center justify-center h-5 w-5 rounded-full border ${
                          watchedAnswers[currentQuestion.id] === opt.kode
                            ? "border-primary"
                            : "border-gray-400"
                        }`}
                      >
                        {watchedAnswers[currentQuestion.id] === opt.kode && (
                          <div className="h-3 w-3 rounded-full bg-primary"></div>
                        )}
                      </div>
                      <input
                        type="radio"
                        name={`answers.${currentQuestion.id}`}
                        value={opt.kode}
                        className="sr-only"
                        onChange={() =>
                          handleAnswerChange(currentQuestion.id, opt.kode)
                        }
                      />
                      <span>{opt.teks}</span>
                    </label>
                  ))}

                {isTrueFalse && (
                  <div className="space-y-2">
                    {["OPSI_0", "OPSI_1"].map((val, i) => (
                      <label
                        key={val}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          watchedAnswers[currentQuestion.id] === val
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        } cursor-pointer transition-colors`}
                      >
                        <div
                          className={`flex items-center justify-center h-5 w-5 rounded-full border ${
                            watchedAnswers[currentQuestion.id] === val
                              ? "border-primary"
                              : "border-gray-400"
                          }`}
                        >
                          {watchedAnswers[currentQuestion.id] === val && (
                            <div className="h-3 w-3 rounded-full bg-primary"></div>
                          )}
                        </div>
                        <input
                          type="radio"
                          value={val}
                          className="sr-only"
                          onChange={() =>
                            handleAnswerChange(currentQuestion.id, val)
                          }
                        />
                        <span>{i === 0 ? "Benar" : "Salah"}</span>
                      </label>
                    ))}
                  </div>
                )}

                {isEssay && (
                  <FormField
                    name={`answers.${currentQuestion.id}`}
                    control={control}
                    type="textarea"
                    placeholder="Tulis jawaban di sini..."
                    rows={5}
                    className="min-h-[120px]"
                  />
                )}

                {/* Answer image upload */}
                <div className="space-y-2 pt-4 border-top">
                  <label className="text-sm font-medium text-gray-700">
                    Upload Gambar Jawaban (Opsional)
                  </label>
                  <div className="flex flex-col gap-2">
                    {answerImages[currentQuestion.id] ? (
                      <div className="relative w-full max-w-sm rounded-md border p-2 bg-gray-50">
                        <img
                          src={answerImages[currentQuestion.id]}
                          alt="Preview Jawaban"
                          className="w-full h-auto rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => removeImage(currentQuestion.id)}
                        >
                          <span className="sr-only">Hapus gambar</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </Button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(currentQuestion.id, e)
                        }
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Sebelumnya
              </Button>

              <div className="flex gap-2">
                {currentIndex < questions.length - 1 && (
                  <Button
                    type="button"
                    onClick={goToNextQuestion}
                    disabled={timeUp}
                  >
                    Selanjutnya <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}

                {currentIndex === questions.length - 1 && (
                  <Button
                    type="button"
                    onClick={handleSubmitClick}
                    disabled={isManualSubmitting || timeUp}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isManualSubmitting ? "Mengirim..." : "Kumpulkan Jawaban"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmSubmit}
        title="Kumpulkan Jawaban?"
        description={`Anda yakin ingin mengumpulkan jawaban ujian ini? Semua ${questions.length} soal telah dijawab.`}
        confirmText="Ya, Kumpulkan"
        cancelText="Periksa Lagi"
        isLoading={isManualSubmitting}
      />
    </div>
  );
}
