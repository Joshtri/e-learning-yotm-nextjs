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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, ArrowLeft, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditSubmissionPage() {
  const { id: assignmentId, studentId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [student, setStudent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [nilai, setNilai] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchData();
  }, [assignmentId, studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/tutor/assignments/${assignmentId}/input-answer/${studentId}`
      );
      setAssignment(res.data.data.assignment);
      setStudent(res.data.data.student);

      // Jika sudah ada submission, isi form dengan data yang ada
      const submission = res.data.data.submission;
      if (submission && submission.answers) {
        const answersMap = {};
        submission.answers.forEach((ans) => {
          answersMap[ans.questionId] = ans.jawaban;
        });
        setAnswers(answersMap);
        setNilai(submission.nilai || "");
        setFeedback(submission.feedback || "");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert answers object to array
      const answersArray = Object.entries(answers).map(([questionId, jawaban]) => ({
        questionId,
        jawaban,
      }));

      const payload = {
        answers: answersArray,
        nilai: nilai ? parseFloat(nilai) : null,
        feedback: feedback || null,
      };

      await api.put(
        `/tutor/assignments/${assignmentId}/input-answer/${studentId}`,
        payload
      );

      toast.success("Jawaban berhasil disimpan");
      router.push(`/tutor/assignments/${assignmentId}/student-answers`);
    } catch (error) {
      console.error("Error saving submission:", error);
      toast.error(error.response?.data?.message || "Gagal menyimpan jawaban");
    } finally {
      setSaving(false);
    }
  };

  const renderQuestionInput = (question, index) => {
    const currentAnswer = answers[question.id] || "";

    return (
      <Card key={question.id} className="mb-4">
        <CardHeader className="bg-muted/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Soal {index + 1}
              <Badge variant="outline" className="ml-2">
                {question.jenis.replace("_", " ")}
              </Badge>
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({question.poin} poin)
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Soal Text */}
          <div className=" rounded-lg">
            <Label className="text-blue-900  font-semibold">
              Pertanyaan:
            </Label>
            <p className="mt-2 text-blue-900 text-base">
              {question.teks}
            </p>
          </div>

          {/* Opsi Pilihan Ganda */}
          {question.jenis === "MULTIPLE_CHOICE" && question.options?.length > 0 && (
            <div className="space-y-3">
              <Label className="font-semibold text-base">Pilihan Jawaban:</Label>
              <RadioGroup
                value={currentAnswer}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
                className="space-y-3"
              >
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-muted/50 hover:border-primary transition-colors"
                  >
                    <RadioGroupItem
                      value={option.kode || option.id}
                      id={`${question.id}-${option.id}`}
                      className="mt-1.5"
                    />
                    <Label
                      htmlFor={`${question.id}-${option.id}`}
                      className="flex-1 cursor-pointer text-base leading-relaxed"
                    >
                      {option.kode && (
                        <span className="font-bold mr-2 text-lg">{option.kode}.</span>
                      )}
                      <span className="text-foreground">{option.teks}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* True/False */}
          {question.jenis === "TRUE_FALSE" && (
            <div className="space-y-3">
              <Label className="font-semibold text-base">Pilih Jawaban:</Label>
              <RadioGroup
                value={currentAnswer}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-muted/50 hover:border-primary transition-colors">
                  <RadioGroupItem value="true" id={`${question.id}-true`} />
                  <Label
                    htmlFor={`${question.id}-true`}
                    className="flex-1 cursor-pointer font-medium text-base text-foreground"
                  >
                    ✓ Benar
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-muted/50 hover:border-primary transition-colors">
                  <RadioGroupItem value="false" id={`${question.id}-false`} />
                  <Label
                    htmlFor={`${question.id}-false`}
                    className="flex-1 cursor-pointer font-medium text-base text-foreground"
                  >
                    ✗ Salah
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Short Answer */}
          {question.jenis === "SHORT_ANSWER" && (
            <div className="space-y-3">
              <Label className="font-semibold text-base">Jawaban Singkat:</Label>
              <Textarea
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Ketik jawaban singkat di sini..."
                rows={3}
                className="w-full text-base p-4 resize-none"
              />
            </div>
          )}

          {/* Essay */}
          {question.jenis === "ESSAY" && (
            <div className="space-y-3">
              <Label className="font-semibold text-base">Jawaban Essay:</Label>
              <Textarea
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Ketik jawaban essay di sini..."
                rows={10}
                className="w-full text-base p-4"
              />
            </div>
          )}

          {/* Matching */}
          {question.jenis === "MATCHING" && (
            <div className="space-y-3">
              <Label className="font-semibold text-base">Jawaban (Matching):</Label>
              <Textarea
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Ketik jawaban matching di sini..."
                rows={6}
                className="w-full text-base p-4"
              />
            </div>
          )}

          {/* Preview Jawaban */}
          {currentAnswer && (
            <div className="bg-green-50  p-4 rounded-lg border-2 border-green-300 dark:border-green-700">
              <Label className="text-green-900 text-sm font-semibold">
                ✓ Jawaban Terpilih:
              </Label>
              <p className="text-green-800  mt-2 font-medium text-base whitespace-pre-wrap">
                {currentAnswer}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!assignment || !student) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Data tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Input/Edit Jawaban Siswa"
        description={`Mengisi jawaban untuk ${student.namaLengkap || student.user?.nama}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor" },
          { label: "Tugas", href: "/tutor/assignments" },
          {
            label: assignment.judul,
            href: `/tutor/assignments/${assignmentId}/student-answers`,
          },
          { label: "Input Jawaban" },
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

      {/* Info Tugas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Tugas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Judul Tugas</Label>
              <p className="font-semibold text-base">{assignment.judul}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Jenis</Label>
              <div>
                <Badge variant="secondary">{assignment.jenis.replace("_", " ")}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Kelas</Label>
              <p className="font-medium">
                {assignment.classSubjectTutor?.class?.namaKelas || "-"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Mata Pelajaran</Label>
              <p className="font-medium">
                {assignment.classSubjectTutor?.subject?.namaMapel || "-"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Siswa</Label>
              <p className="font-semibold text-base">
                {student.namaLengkap || student.user?.nama}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">NISN</Label>
              <p className="font-medium">{student.nisn || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Daftar Soal */}
        {assignment.questionsFromPdf ? (
          <Card>
            <CardHeader>
              <CardTitle>Soal dari PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Soal untuk tugas ini menggunakan file PDF. Anda dapat memasukkan nilai
                langsung tanpa memasukkan jawaban per soal.
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">File PDF tersedia</span>
              </div>
            </CardContent>
          </Card>
        ) : assignment.questions && assignment.questions.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold mb-4">
              Daftar Soal ({assignment.questions.length} soal)
            </h2>
            {assignment.questions.map((question, index) =>
              renderQuestionInput(question, index)
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Tidak ada soal untuk tugas ini
            </CardContent>
          </Card>
        )}

        {/* Penilaian */}
        <Card className="border-2">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg">Penilaian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <Label htmlFor="nilai" className="text-base font-semibold">
                Nilai{" "}
                {assignment.nilaiMaksimal && (
                  <span className="text-muted-foreground">(Maksimal: {assignment.nilaiMaksimal})</span>
                )}
              </Label>
              <Input
                id="nilai"
                type="number"
                step="0.01"
                min="0"
                max={assignment.nilaiMaksimal || undefined}
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder="Masukkan nilai..."
                className="text-lg p-4 mt-2 w-full md:w-1/2"
              />
            </div>
            <div>
              <Label htmlFor="feedback" className="text-base font-semibold">
                Feedback untuk Siswa (Opsional)
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Berikan catatan atau feedback untuk siswa..."
                rows={6}
                className="text-base p-4 mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 sticky bottom-4 bg-background/95 backdrop-blur p-6 rounded-lg border-2 shadow-lg">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push(`/tutor/assignments/${assignmentId}/student-answers`)}
            disabled={saving}
            className="text-base px-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Batal
          </Button>
          <Button type="submit" disabled={saving} size="lg" className="text-base px-8">
            <Save className="h-5 w-5 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Jawaban"}
          </Button>
        </div>
      </form>
    </div>
  );
}
