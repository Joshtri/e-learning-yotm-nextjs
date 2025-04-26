import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth"; // Import fungsi untuk mendapatkan user dari cookie
import { NextResponse } from "next/server";

// GET – Ambil data ujian milik tutor yang sedang login
export async function GET() {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil tutorId berdasarkan user.id
    const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const exams = await prisma.assignment.findMany({
      where: {
        jenis: { in: ["MIDTERM", "FINAL_EXAM"] },
        classSubjectTutor: {
          tutorId: tutor.id,
        },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
          },
        },
      },
      orderBy: { waktuSelesai: "desc" },
    });

    return NextResponse.json({ success: true, data: exams });
  } catch (error) {
    console.error("Gagal ambil data ujian:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data ujian" },
      { status: 500 }
    );
  }
}

// POST – Tambah ujian baru (hanya jika classSubjectTutorId milik tutor ini)
// POST – Tambah ujian baru (hanya jika classSubjectTutorId milik tutor ini)
export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      judul,
      deskripsi,
      jenis,
      classSubjectTutorId,
      waktuMulai,
      waktuSelesai,
      durasiMenit,
      nilaiMaksimal,
    } = body;

    if (
      !judul ||
      !jenis ||
      !classSubjectTutorId ||
      !waktuMulai ||
      !waktuSelesai ||
      !durasiMenit ||
      !nilaiMaksimal
    ) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Cek apakah classSubjectTutorId milik tutor login
    const classSubjectTutor = await prisma.classSubjectTutor.findFirst({
      where: {
        id: classSubjectTutorId,
        tutorId: tutor.id,
      },
    });

    if (!classSubjectTutor) {
      return NextResponse.json(
        { message: "Anda tidak memiliki akses ke kelas ini" },
        { status: 403 }
      );
    }

    // ✅ Cek apakah sudah ada lebih dari 2 ujian untuk MIDTERM atau FINAL_EXAM
    if (jenis === "MIDTERM" || jenis === "FINAL_EXAM") {
      const existingCount = await prisma.assignment.count({
        where: {
          classSubjectTutorId,
          jenis,
        },
      });

      if (existingCount >= 2) {
        return NextResponse.json(
          {
            message: `Ujian ${
              jenis === "MIDTERM" ? "UTS" : "UAS"
            } tidak boleh dibuat lebih dari 2 kali untuk kelas dan mapel ini.`,
          },
          { status: 400 }
        );
      }
    }

    const newExam = await prisma.assignment.create({
      data: {
        judul,
        deskripsi,
        jenis,
        classSubjectTutorId,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        batasWaktuMenit: Number(durasiMenit),
        nilaiMaksimal: Number(nilaiMaksimal),
      },
    });

    return NextResponse.json(
      { message: "Ujian berhasil dibuat", data: newExam },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal membuat ujian:", error);
    return NextResponse.json(
      { message: "Gagal membuat ujian", error: error.message },
      { status: 500 }
    );
  }
}
