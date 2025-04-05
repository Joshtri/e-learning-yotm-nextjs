import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function SubmissionDetailPage({ params }) {
  const { submissionId } = params;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: true,
      assignment: {
        include: {
          classSubjectTutor: {
            include: {
              class: true,
              subject: true,
            },
          },
        },
      },
      answers: {
        include: {
          question: {
            include: {
              options: true,
            },
          },
        },
      },
    },
  });

  if (!submission) return notFound();

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">
          Jawaban: {submission.student.namaLengkap}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ujian: {submission.assignment.judul}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Badge>Status: {submission.status}</Badge>
        <Badge>Nilai: {submission.nilai ?? "-"}</Badge>
        <Badge>
          Kelas: {submission.assignment.classSubjectTutor.class.namaKelas}
        </Badge>
        <Badge>
          Mapel: {submission.assignment.classSubjectTutor.subject.namaMapel}
        </Badge>
      </div>

      <div className="space-y-6 mt-6">
        {submission.answers.map((ans, idx) => {
          const question = ans.question;
          const jawabanBenar = question.options.find(
            (o) => o.adalahBenar
          )?.teks;
          const isCorrect = ans.adalahBenar;

          return (
            <div key={ans.id} className="border rounded-md p-4 space-y-2">
              <p className="font-medium">
                {idx + 1}. {question.teks}
              </p>

              <p className="text-sm">
                Jawaban siswa:{" "}
                <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                  {ans.jawaban}
                </span>
              </p>

              <p className="text-sm">Jawaban benar: {jawabanBenar || "-"}</p>
              {question.pembahasan && (
                <p className="text-sm text-muted-foreground">
                  <strong>Pembahasan:</strong> {question.pembahasan}
                </p>
              )}

              <p className="text-sm">Poin: {ans.nilai ?? 0}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
