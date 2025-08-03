import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        class: {
          include: {
            classSubjectTutors: true,
          },
        },
      },
    });

    if (!student || !student.class) {
      return NextResponse.json(
        { success: false, message: "Kelas siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    const studentId = student.id;
    const classSubjectTutorIds = student.class.classSubjectTutors.map(
      (cst) => cst.id
    );

    // Only get MIDTERM and FINAL_EXAM assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        classSubjectTutorId: {
          in: classSubjectTutorIds,
        },
        jenis: {
          in: ["MIDTERM", "FINAL_EXAM"],
        },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
            tutor: { select: { namaLengkap: true } },
          },
        },
        submissions: {
          where: { studentId },
          select: { id: true, nilai: true },
        },
      },
      orderBy: {
        waktuMulai: "asc",
      },
    });

    const data = assignments.map((exam) => ({
      id: exam.id,
      judul: exam.judul,
      jenis: exam.jenis,
      jenisDeskripsi:
        exam.jenis === "MIDTERM"
          ? "Ujian Tengah Semester"
          : "Ujian Akhir Semester",
      waktuMulai: exam.waktuMulai,
      waktuSelesai: exam.waktuSelesai,
      batasWaktuMenit: exam.batasWaktuMenit,
      nilaiMaksimal: exam.nilaiMaksimal,
      class: exam.classSubjectTutor.class,
      subject: exam.classSubjectTutor.subject,
      tutor: exam.classSubjectTutor.tutor,
      sudahDikerjakan: exam.submissions.length > 0,
      nilai: exam.submissions[0]?.nilai ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Gagal ambil data exams:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data ujian" },
      { status: 500 }
    );
  }
}
