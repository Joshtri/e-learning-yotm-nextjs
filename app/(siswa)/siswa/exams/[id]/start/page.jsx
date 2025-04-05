"use client";

import { useEffect, useState } from "react";
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

export default function StudentExamStartPage() {
  const { id: examId } = useParams();
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [examInfo, setExamInfo] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      answers: {},
    },
  });

  const watchedAnswers = watch("answers");

  const handleAnswerChange = (questionId, value) => {
    setValue(`answers.${questionId}`, value);
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/student/exams/${examId}`);
        setQuestions(res.data.data.questions);
        setExamInfo(res.data.data.exam);
      } catch (err) {
        toast.error("Gagal memuat soal");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [examId]);

  const onSubmit = async (data) => {
    try {
      await api.post(`/student/exams/${examId}/submit`, data);
      toast.success("Jawaban berhasil dikumpulkan!");
      router.push("/siswa/exams");
    } catch (err) {
      toast.error("Gagal mengirim jawaban");
    }
  };

  const goToNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const isQuestionAnswered = (questionId) => {
    return (
      watchedAnswers[questionId] !== undefined &&
      watchedAnswers[questionId] !== ""
    );
  };

  const calculateProgress = () => {
    if (!questions || questions.length === 0) return 0;
    const answeredCount = Object.keys(watchedAnswers).filter(
      (key) => watchedAnswers[key] !== undefined && watchedAnswers[key] !== ""
    ).length;
    return (answeredCount / questions.length) * 100;
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{examInfo?.judul || "Ujian"}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {examInfo?.subject?.nama || ""}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progres</span>
              <span>{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
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

                {currentIndex === questions.length - 1 ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Mengirim..." : "Kumpulkan Jawaban"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={goToNextQuestion}
                    disabled={currentIndex === questions.length - 1}
                  >
                    Selanjutnya <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
