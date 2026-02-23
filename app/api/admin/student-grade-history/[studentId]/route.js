import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { studentId } = await params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        namaLengkap: true,
        nisn: true,
        nis: true,
        status: true,
        user: {
          select: { email: true },
        },
        class: {
          select: {
            namaKelas: true,
            program: { select: { namaPaket: true } },
          },
        },
        StudentClassHistory: {
          include: {
            class: {
              select: {
                namaKelas: true,
                program: { select: { namaPaket: true } },
              },
            },
            academicYear: {
              select: {
                id: true,
                tahunMulai: true,
                tahunSelesai: true,
                semester: true,
              },
            },
          },
          orderBy: [
            { academicYear: { tahunMulai: "asc" } },
            { academicYear: { semester: "asc" } },
          ],
        },
        FinalScore: {
          include: {
            subject: {
              select: { namaMapel: true, kodeMapel: true },
            },
            academicYear: {
              select: {
                id: true,
                tahunMulai: true,
                tahunSelesai: true,
                semester: true,
              },
            },
          },
        },
        BehaviorScore: {
          include: {
            academicYear: {
              select: {
                id: true,
                tahunMulai: true,
                tahunSelesai: true,
                semester: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    // Merge FinalScore and BehaviorScore into each history entry
    const history = student.StudentClassHistory.map((entry) => {
      const ayId = entry.academicYearId;

      const finalScores = student.FinalScore.filter(
        (fs) => fs.tahunAjaranId === ayId
      ).map((fs) => ({
        namaMapel: fs.subject.namaMapel,
        kodeMapel: fs.subject.kodeMapel,
        nilaiAkhir: fs.nilaiAkhir,
      }));

      const behaviorScore = student.BehaviorScore.find(
        (bs) => bs.academicYearId === ayId
      );

      return {
        academicYearId: ayId,
        academicYear: entry.academicYear,
        class: {
          namaKelas: entry.class.namaKelas,
          namaPaket: entry.class.program?.namaPaket || null,
        },
        naikKelas: entry.naikKelas,
        nilaiAkhir: entry.nilaiAkhir ?? null,
        finalScores,
        behaviorScore: behaviorScore
          ? {
              spiritual: behaviorScore.spiritual,
              sosial: behaviorScore.sosial,
              kehadiran: behaviorScore.kehadiran,
              catatan: behaviorScore.catatan ?? null,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          namaLengkap: student.namaLengkap,
          nisn: student.nisn,
          nis: student.nis,
          status: student.status,
          email: student.user?.email ?? null,
          currentClass: student.class
            ? {
                namaKelas: student.class.namaKelas,
                namaPaket: student.class.program?.namaPaket ?? null,
              }
            : null,
        },
        history,
      },
    });
  } catch (error) {
    console.error("[ERROR GET STUDENT GRADE HISTORY DETAIL]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
