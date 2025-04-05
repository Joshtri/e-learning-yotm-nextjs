"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Circle, ArrowLeft, ArrowRight, Send } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function QuizStartPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/student/quizzes/${id}`);
        setQuiz(res.data.data);
      } catch (err) {
        toast.error("Gagal memuat kuis");
      }
    };
    fetchQuiz();
  }, [id]);

//   useEffect(() => {
//     if (!quiz?.waktuMulai || !quiz?.durasiMenit) return;

//     const mulai = new Date(quiz.waktuMulai).getTime();
//     const selesai = mulai + quiz.durasiMenit * 60 * 1000;
//     const now = Date.now();
//     const selisihDetik = Math.floor((selesai - now) / 1000);

//     if (selisihDetik <= 0) {
//       toast.warning("Waktu kuis telah habis!");
//       handleSubmit(); // auto-submit kalau ternyata udah habis
//       return;
//     }

//     setTimeLeft(selisihDetik);
//   }, [quiz]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await api.post(`/student/quizzes/${id}/submit`, { answers });
      toast.success("Jawaban berhasil dikirim");
      router.push("/siswa/quizzes");
    } catch (err) {
      toast.error("Gagal mengirim jawaban");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const isQuestionAnswered = (questionId) => {
    return answers[questionId] !== undefined && answers[questionId] !== "";
  };

  const calculateProgress = () => {
    if (!quiz) return 0;
    const answeredCount = Object.keys(answers).length;
    return (answeredCount / quiz.questions.length) * 100;
  };

//   useEffect(() => {
//     if (timeLeft <= 0) return;

//     const timer = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           clearInterval(timer);
//           handleSubmit(); // otomatis submit
//           toast.warning("Waktu habis! Jawaban dikirim otomatis.");
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [timeLeft]);

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Memuat...</div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{quiz.judul}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {quiz.classSubjectTutor?.subject?.nama || ""}
          </div>

          {/* <div className="text-sm font-semibold text-red-600">
            Sisa waktu: {formatTime(timeLeft)}
          </div> */}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Question Navigation Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daftar Soal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 md:grid-cols-3 gap-2">
                {quiz.questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`flex items-center justify-center h-10 w-10 rounded-full border ${
                      currentQuestionIndex === index
                        ? "border-primary bg-primary text-primary-foreground"
                        : isQuestionAnswered(question.id)
                        ? "border-green-500 bg-green-100 text-green-700"
                        : "border-gray-300 bg-background"
                    }`}
                    aria-label={`Soal ${index + 1}`}
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

        {/* Current Question */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">
                  Soal {currentQuestionIndex + 1} dari {quiz.questions.length}
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

                {currentQuestion.options.length > 0 ? (
                  <div className="space-y-2">
                    {currentQuestion.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          answers[currentQuestion.id] === opt.teks
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        } cursor-pointer transition-colors`}
                      >
                        <div
                          className={`flex items-center justify-center h-5 w-5 rounded-full border ${
                            answers[currentQuestion.id] === opt.tek
                              ? "border-primary"
                              : "border-gray-400"
                          }`}
                        >
                          {answers[currentQuestion.id] === opt.teks && (
                            <div className="h-3 w-3 rounded-full bg-primary"></div>
                          )}
                        </div>
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value={opt.teks}
                          onChange={() =>
                            handleAnswerChange(currentQuestion.id, opt.teks)
                          }
                          checked={answers[currentQuestion.id] === opt.teks}
                          className="sr-only"
                        />
                        <span>{opt.teks}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    className="w-full min-h-[120px] border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ketik jawaban Anda di sini..."
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, e.target.value)
                    }
                    value={answers[currentQuestion.id] || ""}
                  />
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Sebelumnya
              </Button>

              {currentQuestionIndex === quiz.questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Mengirim..." : "Kirim Semua Jawaban"}
                </Button>
              ) : (
                <Button
                  onClick={goToNextQuestion}
                  disabled={currentQuestionIndex === quiz.questions.length - 1}
                >
                  Selanjutnya <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
