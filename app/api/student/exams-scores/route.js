import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const submissions = await prisma.submission.findMany({
      where: {
        studentId: student.id,
        assignmentId: { not: null }, // khusus assignment
        assignment: {
          jenis: {
            in: ["DAILY_TEST", "START_SEMESTER_TEST", "MIDTERM", "FINAL_EXAM"],
          },
        },
        status: { in: ["SUBMITTED", "GRADED"] }, // 💥 INI DIA FLEXIBLE: mau SUBMITTED, mau GRADED
      },
      include: {
        assignment: {
          select: {
            id: true,
            judul: true,
            jenis: true,
            nilaiMaksimal: true,
            classSubjectTutor: {
              select: {
                subject: { select: { id: true, namaMapel: true } },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc", // ❗ updatedAt lebih aman daripada waktuDinilai
      },
    });

    const scores = submissions.map((submission) => {
      const nilai = submission.nilai ?? 0;
      const nilaiMaksimal = submission.assignment?.nilaiMaksimal ?? 100;
      const jenis = submission.assignment?.jenis ?? "-";

      return {
        id: submission.id,
        title: submission.assignment?.judul || "-",
        subject: submission.assignment?.classSubjectTutor?.subject || null,
        jenis,
        nilai,
        nilaiMaksimal,
        statusKelulusan: nilai >= nilaiMaksimal ? "LULUS" : "TIDAK LULUS",

        // statusKelulusan: nilai >= 0.6 * nilaiMaksimal ? "LULUS" : "TIDAK LULUS",
      };
    });

    return NextResponse.json({ success: true, data: scores }, { status: 200 });
  } catch (error) {
    console.error("Gagal memuat nilai ujian:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat nilai ujian" },
      { status: 500 }
    );
  }
}
