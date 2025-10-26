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
import { ArrowLeft, CheckCircle, XCircle, FileText } from "lucide-react";
import { PDFViewerButton } from "@/components/ui/pdf-viewer";

export default function ViewSubmissionPage() {
  const params = useParams();
  const assignmentId = params.id;
  const submissionId = params.submissionId;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    fetchData();
  }, [submissionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tutor/submissions/${submissionId}`);
      setSubmission(res.data.data.submission);
      setAssignment(res.data.data.submission.assignment);
      setStudent(res.data.data.submission.student);
    } catch (error) {
      console.error("Error fetching submission:", error);
      toast.error("Gagal memuat data jawaban");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      NOT_STARTED: "secondary",
      IN_PROGRESS: "warning",
      SUBMITTED: "primary",
      GRADED: "success",
      LATE: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const renderAnswerResult = (answer, question) => {
    if (!answer) return <span className="text-muted-foreground">Tidak dijawab</span>;

    const isCorrect = answer.adalahBenar;
    const hasGrade = answer.nilai != null;

    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          {isCorrect !== null && (
            <div className="mt-1">
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          )}
          <div className="flex-1">
            <div className="font-medium">{answer.jawaban}</div>
            {answer.feedback && (
              <div className="text-sm text-muted-foreground mt-1">
                Feedback: {answer.feedback}
              </div>
            )}
            {hasGrade && (
              <div className="text-sm font-medium mt-1">
                Nilai: {Number(answer.nilai).toFixed(2)} / {question.poin}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
        title="Lihat Jawaban Siswa"
        description={`Jawaban dari ${student?.namaLengkap || student?.user?.nama}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor" },
          { label: "Tugas", href: "/tutor/assignments" },
          {
            label: assignment?.judul || "Tugas",
            href: `/tutor/assignments/${assignmentId}/student-answers`,
          },
          { label: "Lihat Jawaban" },
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
              <Label className="text-muted-foreground">Status</Label>
              <div>{getStatusBadge(submission.status)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Waktu Mulai</Label>
              <p>
                {submission.waktuMulai
                  ? new Date(submission.waktuMulai).toLocaleString("id-ID")
                  : "-"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Waktu Kumpul</Label>
              <p>
                {submission.waktuKumpul
                  ? new Date(submission.waktuKumpul).toLocaleString("id-ID")
                  : "-"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Nilai</Label>
              <p className="font-bold text-lg">
                {submission.nilai != null ? Number(submission.nilai).toFixed(2) : "-"}
                {assignment?.nilaiMaksimal && ` / ${Number(assignment.nilaiMaksimal).toFixed(2)}`}
              </p>
            </div>
          </div>
          {submission.feedback && (
            <div className="mt-4">
              <Label className="text-muted-foreground">Feedback</Label>
              <p className="mt-1">{submission.feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {submission.answerPdf ? (
        <Card>
          <CardHeader>
            <CardTitle>Jawaban PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <PDFViewerButton
              pdfData={submission.answerPdf}
              title={`Jawaban - ${student?.namaLengkap}`}
              downloadFileName={`Jawaban_${student?.namaLengkap}.pdf`}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignment?.questions?.map((question, index) => {
            const answer = submission.answers?.find(
              (ans) => ans.questionId === question.id
            );

            return (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    Soal {index + 1}{" "}
                    <Badge variant="outline" className="ml-2">
                      {question.jenis.replace("_", " ")}
                    </Badge>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({question.poin} poin)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{question.teks}</p>
                  </div>

                  {question.jenis === "MULTIPLE_CHOICE" &&
                    question.options?.length > 0 && (
                      <div className="space-y-2 bg-muted/50 p-3 rounded">
                        <div className="font-medium text-sm">Pilihan:</div>
                        {question.options.map((option) => (
                          <div key={option.id} className="text-sm">
                            {option.kode && (
                              <span className="font-medium mr-2">{option.kode}.</span>
                            )}
                            {option.teks}
                            {option.adalahBenar && (
                              <Badge variant="success" className="ml-2">
                                Jawaban Benar
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  <div>
                    <Label className="text-muted-foreground">Jawaban Siswa:</Label>
                    <div className="mt-2">{renderAnswerResult(answer, question)}</div>
                  </div>

                  {question.pembahasan && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                      <Label className="text-blue-900 dark:text-blue-100">
                        Pembahasan:
                      </Label>
                      <p className="text-sm mt-1 text-blue-800 dark:text-blue-200">
                        {question.pembahasan}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-3">
        {submission.nilai == null && (
          <Button
            onClick={() =>
              router.push(
                `/tutor/assignments/${assignmentId}/student-answers/${submissionId}/grade`
              )
            }
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Beri Nilai
          </Button>
        )}
      </div>
    </div>
  );
}
