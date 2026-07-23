import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * Sama persis dengan logika di student submit — disimpan di sini agar
 * re-grade dan submit menggunakan algoritma yang identik.
 */
function gradeMultipleChoice(q, jawabanSiswa) {
  if (!jawabanSiswa) return { benar: false, nilai: 0 };

  let opsiBenar = q.options.find((opt) => opt.adalahBenar === true);

  if (!opsiBenar && q.jawabanBenar != null) {
    const jb = String(q.jawabanBenar).trim();
    opsiBenar =
      q.options.find((o) => o.kode?.trim() === jb) ||
      q.options.find((o) => o.kode?.trim() === `OPSI_${jb}`);

    if (!opsiBenar) {
      const idx = parseInt(jb);
      if (!isNaN(idx) && idx >= 0 && idx < q.options.length) {
        opsiBenar = q.options[idx];
      }
    }
  }

  if (!opsiBenar) return { benar: false, nilai: 0 };

  const studentNorm = String(jawabanSiswa).trim().toLowerCase();
  const poin = q.poin ?? 0;

  if (opsiBenar.kode) {
    const benar = studentNorm === opsiBenar.kode.trim().toLowerCase();
    return { benar, nilai: benar ? poin : 0 };
  }

  const correctIdx = q.options.indexOf(opsiBenar);
  const studentIdx = parseInt(studentNorm.replace("opsi_", ""));
  const benar = !isNaN(studentIdx) && studentIdx === correctIdx;
  return { benar, nilai: benar ? poin : 0 };
}

// POST /api/tutor/exams/[id]/regrade
// Menghitung ulang nilai untuk semua submission ujian ini.
// Aman dijalankan berulang kali (idempotent).
export async function POST(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const { id: assignmentId } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { classSubjectTutor: true },
    });

    if (!assignment || assignment.classSubjectTutor.tutorId !== tutor.id) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
    }

    // Muat semua soal beserta opsi jawaban
    const questions = await prisma.question.findMany({
      where: { assignmentId },
      include: { options: true },
    });

    const questionMap = Object.fromEntries(questions.map((q) => [q.id, q]));

    // Muat semua submission yang sudah dikumpul (SUBMITTED atau GRADED)
    const submissions = await prisma.submission.findMany({
      where: {
        assignmentId,
        status: { in: ["SUBMITTED", "GRADED"] },
      },
      include: { answers: true },
    });

    let regraded = 0;

    for (const sub of submissions) {
      let totalNilai = 0;

      for (const ans of sub.answers) {
        const q = questionMap[ans.questionId];
        if (!q) continue;

        if (["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(q.jenis)) {
          const { benar, nilai } = gradeMultipleChoice(q, ans.jawaban);
          totalNilai += nilai;

          await prisma.answer.update({
            where: { id: ans.id },
            data: { adalahBenar: benar, nilai },
          });
        } else {
          // Essay — pertahankan nilai manual yang sudah ada
          totalNilai += ans.nilai ?? 0;
        }
      }

      await prisma.submission.update({
        where: { id: sub.id },
        data: {
          nilai: totalNilai,
          status: "GRADED",
          waktuDinilai: new Date(),
        },
      });

      regraded++;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menilai ulang ${regraded} submission.`,
      regraded,
    });
  } catch (error) {
    console.error("Gagal re-grade:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menilai ulang" },
      { status: 500 }
    );
  }
}
