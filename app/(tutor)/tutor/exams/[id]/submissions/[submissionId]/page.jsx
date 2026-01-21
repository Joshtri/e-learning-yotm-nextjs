"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  ArrowLeft,
} from "lucide-react";

export default function SubmissionDetailPage() {
  const { id: examId, submissionId } = useParams();
  const router = useRouter();

  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [answerScores, setAnswerScores] = useState({});
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/tutor/submissions/${submissionId}`);
        // API returns { data: { submission } }
        const data = res.data.data?.submission || res.data.data;
        setSubmission(data);

        // Initialize answer scores
        const initialScores = {};
        data.answers?.forEach((ans) => {
          initialScores[ans.id] = ans.nilai ?? 0;
        });
        setAnswerScores(initialScores);
        setFeedback(data.feedback || "");
      } catch (error) {
        console.error("Gagal memuat submission:", error);
        toast.error("Gagal memuat data jawaban");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  const handleScoreChange = (answerId, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setAnswerScores((prev) => ({
      ...prev,
      [answerId]: numValue,
    }));
  };

  const calculateTotalScore = () => {
    return Object.values(answerScores).reduce((sum, score) => sum + score, 0);
  };

  const handleSaveGrades = async () => {
    try {
      setIsSaving(true);

      const totalNilai = calculateTotalScore();

      // Prepare answers data
      const answersData = Object.entries(answerScores).map(
        ([answerId, nilai]) => ({
          answerId,
          nilai,
        })
      );

      await api.put(`/tutor/submissions/${submissionId}`, {
        nilai: totalNilai,
        feedback,
        answers: answersData,
      });

      toast.success("Nilai berhasil disimpan!");
      router.push(`/tutor/exams/${examId}/submissions`);
    } catch (error) {
      console.error("Gagal simpan nilai:", error);
      toast.error("Gagal menyimpan nilai");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Memuat...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-muted-foreground">Data tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <PageHeader
        title={`Periksa Jawaban: ${submission.student?.namaLengkap}`}
        description={`Ujian: ${submission.assignment?.judul}`}
        backButton={true}
        backButtonLink={`/tutor/exams/${examId}/submissions`}
        backButtonLabel="Kembali"
        breadcrumbs={[
          { label: "Ujian", href: "/tutor/exams" },
          { label: "Hasil Ujian", href: `/tutor/exams/${examId}/submissions` },
          { label: "Periksa Jawaban" },
        ]}
      />

      {/* Info Siswa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Nama:</span>
              <p className="font-medium">{submission.student?.namaLengkap}</p>
            </div>
            <div>
              <span className="text-muted-foreground">NISN:</span>
              <p className="font-medium">{submission.student?.nisn || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Kelas:</span>
              <p className="font-medium">
                {submission.assignment?.classSubjectTutor?.class?.namaKelas}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Waktu Kumpul:</span>
              <p className="font-medium">
                {submission.waktuKumpul
                  ? new Date(submission.waktuKumpul).toLocaleString("id-ID")
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daftar Jawaban */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Jawaban Siswa ({submission.answers?.length || 0} soal)
        </h2>

        {submission.answers?.map((ans, idx) => {
          const question = ans.question;
          const correctOption = question?.options?.find((o) => o.adalahBenar);
          const isEssay = question?.jenis === "ESSAY";
          const isAutoGraded = ["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(
            question?.jenis
          );

          // Untuk pilihan ganda/benar-salah, cari teks jawaban dari opsi
          let jawabanSiswaText = ans.jawaban;
          if (isAutoGraded && ans.jawaban) {
            const selectedOption = question?.options?.find(
              (o) => o.kode === ans.jawaban
            );
            jawabanSiswaText = selectedOption?.teks || ans.jawaban;
          }

          return (
            <Card key={ans.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">Soal {idx + 1}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {question?.jenis === "MULTIPLE_CHOICE"
                        ? "Pilihan Ganda"
                        : question?.jenis === "TRUE_FALSE"
                        ? "Benar/Salah"
                        : "Essay"}
                    </Badge>
                    <Badge variant="secondary">
                      Maks: {question?.poin || 0} poin
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Teks Soal */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Pertanyaan:
                  </p>
                  <p className="text-sm">{question?.teks}</p>
                </div>

                {/* Gambar Soal */}
                {question?.image && (
                  <div>
                    <img
                      src={question.image}
                      alt="Gambar Soal"
                      className="max-w-full h-auto rounded-md border max-h-48 object-contain"
                    />
                  </div>
                )}

                {/* Jawaban Siswa */}
                <div
                  className={`p-3 rounded-lg border ${
                    isEssay
                      ? "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
                      : ans.adalahBenar
                      ? "border-green-200 bg-green-50 dark:bg-green-950/20"
                      : "border-red-200 bg-red-50 dark:bg-red-950/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!isEssay && (
                      <>
                        {ans.adalahBenar ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                      </>
                    )}
                    {isEssay && (
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Jawaban Siswa:</p>
                      <p className="text-sm whitespace-pre-wrap">
                        {jawabanSiswaText || "(Tidak menjawab)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gambar Jawaban Siswa */}
                {ans.image && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Gambar Jawaban:
                    </p>
                    <img
                      src={ans.image}
                      alt="Gambar Jawaban"
                      className="max-w-full h-auto rounded-md border max-h-48 object-contain"
                    />
                  </div>
                )}

                {/* Kunci Jawaban (untuk pilihan ganda/benar-salah) */}
                {isAutoGraded && (
                  <div className="p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Kunci Jawaban: {correctOption?.teks || "Belum ditentukan"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Pembahasan */}
                {question?.pembahasan && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Pembahasan:
                    </p>
                    <p className="text-sm">{question.pembahasan}</p>
                  </div>
                )}

                {/* Input Nilai */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  <Label className="text-sm font-medium">Nilai:</Label>
                  <Input
                    type="number"
                    min="0"
                    max={question?.poin || 100}
                    value={answerScores[ans.id] || 0}
                    onChange={(e) => handleScoreChange(ans.id, e.target.value)}
                    className="w-24"
                    disabled={isAutoGraded && !isEssay}
                  />
                  <span className="text-sm text-muted-foreground">
                    / {question?.poin || 0} poin
                  </span>
                  {isAutoGraded && (
                    <Badge variant="outline" className="ml-auto">
                      Auto-graded
                    </Badge>
                  )}
                  {isEssay && (
                    <Badge variant="secondary" className="ml-auto">
                      Perlu dinilai manual
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Total Nilai & Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Penilaian Akhir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Total Nilai:</Label>
            <div className="text-2xl font-bold text-green-600">
              {calculateTotalScore()}
            </div>
            <span className="text-muted-foreground">
              / {submission.assignment?.nilaiMaksimal || 100}
            </span>
          </div>

          <div>
            <Label className="text-sm font-medium">
              Feedback untuk Siswa (opsional):
            </Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tulis feedback atau catatan untuk siswa..."
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(`/tutor/exams/${examId}/submissions`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <Button
            onClick={handleSaveGrades}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Menyimpan..." : "Simpan Nilai"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
