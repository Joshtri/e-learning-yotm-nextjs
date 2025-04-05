import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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

      <div>
        <h2 className="text-lg font-semibold mt-6 mb-2">Daftar Soal</h2>
        <p className="pt-8">
          <Link
            href={`/tutor/exams/${id}/submissions`}
            className="text-blue-600 underline"
          >
            Lihat Hasil Ujian
          </Link>
        </p>

        <div className="space-y-4">
          {exam.questions.map((q, index) => (
            <div key={q.id} className="border rounded-md p-4 space-y-2">
              <p className="font-semibold">
                {index + 1}. {q.teks}
              </p>
              <ul className="pl-4 list-disc space-y-1 text-sm">
                {q.options.map((opt) => (
                  <li
                    key={opt.id}
                    className={
                      opt.adalahBenar ? "text-green-600 font-medium" : ""
                    }
                  >
                    {opt.teks}
                    {opt.adalahBenar && " (Benar)"}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Poin: {q.poin}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
