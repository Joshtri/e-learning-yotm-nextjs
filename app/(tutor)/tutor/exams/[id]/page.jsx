import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FileText, Edit, ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default async function ExamDetailPage({ params }) {
  const { id } = params;

  const exam = await prisma.assignment.findUnique({
    where: { id },
    include: {
      classSubjectTutor: {
        include: {
          class: true,
          subject: true,
        },
      },
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  if (!exam) return notFound();

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">{exam.judul}</h1>
        <p className="text-sm text-muted-foreground">
          Tersedia dari: {new Date(exam.waktuMulai).toLocaleString("id-ID")} -{" "}
          {new Date(exam.waktuSelesai).toLocaleString("id-ID")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Badge>Jenis: {exam.jenis === "MIDTERM" ? "UTS" : "UAS"}</Badge>
        <Badge>Kelas: {exam.classSubjectTutor.class?.namaKelas}</Badge>
        <Badge>Mapel: {exam.classSubjectTutor.subject?.namaMapel}</Badge>
        <Badge>Durasi: {exam.batasWaktuMenit} menit</Badge>
        <Badge>Nilai Maksimal: {exam.nilaiMaksimal}</Badge>
      </div>

      {exam.deskripsi && (
        <div>
          <h2 className="text-lg font-semibold mt-6">Deskripsi</h2>
          <p className="text-sm text-muted-foreground">{exam.deskripsi}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-6 mb-6 p-4 bg-muted/50 rounded-lg border">
        <Button asChild>
          <Link href={`/tutor/exams/${id}/submissions`}>
            <FileText className="h-4 w-4 mr-2" />
            Lihat Jawaban Siswa
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/tutor/exams/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Ujian
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/tutor/exams">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Daftar Soal ({exam.questions.length} soal)</h2>

        <div className="space-y-4">
          {exam.questions.map((q, index) => {
            const correctOption = q.options.find((opt) => opt.adalahBenar);
            const hasCorrectAnswer = !!correctOption;

            return (
              <Card key={q.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold">
                      Soal {index + 1}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {q.jenis === "MULTIPLE_CHOICE"
                          ? "Pilihan Ganda"
                          : q.jenis === "TRUE_FALSE"
                          ? "Benar/Salah"
                          : "Essay"}
                      </Badge>
                      <Badge variant="secondary">{q.poin} poin</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Teks Soal */}
                  <p className="text-sm">{q.teks}</p>

                  {/* Gambar Soal */}
                  {q.image && (
                    <div className="my-2">
                      <img
                        src={q.image}
                        alt="Gambar Soal"
                        className="max-w-full h-auto rounded-md border max-h-64 object-contain"
                      />
                    </div>
                  )}

                  {/* Opsi Jawaban */}
                  {q.options.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Opsi Jawaban:</p>
                      <div className="space-y-2">
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              opt.adalahBenar
                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                              opt.adalahBenar
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            }`}>
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className={`flex-1 ${opt.adalahBenar ? "font-medium text-green-700 dark:text-green-400" : ""}`}>
                              {opt.teks}
                            </span>
                            {opt.adalahBenar && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kunci Jawaban */}
                  <div className={`p-3 rounded-lg ${
                    hasCorrectAnswer
                      ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                      : "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                  }`}>
                    <div className="flex items-center gap-2">
                      {hasCorrectAnswer ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            Kunci Jawaban: {correctOption.teks}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            Belum ada kunci jawaban yang ditentukan
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pembahasan */}
                  {q.pembahasan && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Pembahasan:</p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">{q.pembahasan}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
