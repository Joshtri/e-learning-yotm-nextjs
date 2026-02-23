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
        jenisKelamin: true,
        tempatLahir: true,
        tanggalLahir: true,
        user: {
          select: { email: true },
        },
        class: {
          select: {
            namaKelas: true,
            program: { select: { namaPaket: true } },
          },
        },
        // Riwayat kelas per tahun ajaran
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
        },
        // Nilai akhir per mata pelajaran per tahun ajaran
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
        // Nilai sikap & kehadiran per tahun ajaran
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
            class: {
              select: {
                namaKelas: true,
                program: { select: { namaPaket: true } },
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

    // ── Kumpulkan SEMUA academicYearId dari ketiga sumber ─────────────────
    // Ini memastikan semester yang hanya punya FinalScore atau BehaviorScore
    // (tanpa StudentClassHistory) tetap muncul di riwayat.
    const allAcademicYearIds = new Set([
      ...student.StudentClassHistory.map((h) => h.academicYearId),
      ...student.FinalScore.map((fs) => fs.tahunAjaranId),
      ...student.BehaviorScore.map((bs) => bs.academicYearId),
    ]);

    // ── Index masing-masing sumber berdasarkan academicYearId ─────────────
    const historyMap = {};
    const finalScoreMap = {};
    const behaviorMap = {};

    for (const h of student.StudentClassHistory) {
      historyMap[h.academicYearId] = h;
    }

    for (const fs of student.FinalScore) {
      const ayId = fs.tahunAjaranId;
      if (!finalScoreMap[ayId]) finalScoreMap[ayId] = [];
      finalScoreMap[ayId].push({
        namaMapel: fs.subject.namaMapel,
        kodeMapel: fs.subject.kodeMapel,
        nilaiAkhir: fs.nilaiAkhir,
      });
    }

    for (const bs of student.BehaviorScore) {
      behaviorMap[bs.academicYearId] = bs;
    }

    // ── Build history final (union semua sumber) ──────────────────────────
    const history = Array.from(allAcademicYearIds)
      .map((ayId) => {
        const histEntry = historyMap[ayId];
        const bsEntry = behaviorMap[ayId];
        const fsFirst = student.FinalScore.find(
          (fs) => fs.tahunAjaranId === ayId
        );

        // Ambil academicYear dari sumber mana pun yang tersedia
        const academicYear =
          histEntry?.academicYear ||
          bsEntry?.academicYear ||
          fsFirst?.academicYear ||
          null;

        // Ambil data kelas dari sumber mana pun yang tersedia
        const rawClass =
          histEntry?.class || bsEntry?.class || null;

        return {
          academicYearId: ayId,
          academicYear,
          class: rawClass
            ? {
              namaKelas: rawClass.namaKelas,
              namaPaket: rawClass.program?.namaPaket || null,
            }
            : null,
          naikKelas: histEntry?.naikKelas ?? null,
          nilaiAkhir: histEntry?.nilaiAkhir ?? null,
          finalScores: finalScoreMap[ayId] || [],
          behaviorScore: bsEntry
            ? {
              spiritual: bsEntry.spiritual,
              sosial: bsEntry.sosial,
              kehadiran: bsEntry.kehadiran,
              catatan: bsEntry.catatan ?? null,
            }
            : null,
        };
      })
      // Filter yang tidak punya info tahun ajaran, lalu urutkan
      .filter((h) => h.academicYear !== null)
      .sort((a, b) => {
        const yearDiff =
          a.academicYear.tahunMulai - b.academicYear.tahunMulai;
        if (yearDiff !== 0) return yearDiff;
        // GANJIL sebelum GENAP
        const semOrder = { GANJIL: 1, GENAP: 2 };
        return (
          (semOrder[a.academicYear.semester] || 0) -
          (semOrder[b.academicYear.semester] || 0)
        );
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
          jenisKelamin: student.jenisKelamin ?? null,
          tempatLahir: student.tempatLahir ?? null,
          tanggalLahir: student.tanggalLahir ?? null,
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
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
