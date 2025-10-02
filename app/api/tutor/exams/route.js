// route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId");

    const exams = await prisma.assignment.findMany({
      where: {
        jenis: {
          in: ["DAILY_TEST", "START_SEMESTER_TEST", "MIDTERM", "FINAL_EXAM"],
        },
        classSubjectTutor: {
          tutorId: tutor.id,
          class: academicYearId
            ? { academicYearId }
            : {
                isActive: true, // fallback jika tidak dikirim (opsional)
              },
        },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
      orderBy: { TanggalSelesai: "desc" },
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
export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      judul,
      deskripsi,
      jenis,
      classSubjectTutorId,
      tanggalMulai,
      tanggalSelesai,
      durasiMenit,
      nilaiMaksimal,
    } = body;

    if (
      !judul ||
      !jenis ||
      !classSubjectTutorId ||
      !tanggalMulai ||
      !tanggalSelesai ||
      !durasiMenit ||
      !nilaiMaksimal
    ) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi akses
    const classSubjectTutor = await prisma.classSubjectTutor.findFirst({
      where: {
        id: classSubjectTutorId,
        tutorId: tutor.id,
      },
      include: {
        class: {
          include: {
            academicYear: true,
            students: {
              include: { user: true },
            },
          },
        },
        subject: true,
      },
    });

    if (!classSubjectTutor) {
      return NextResponse.json(
        { message: "Anda tidak memiliki akses ke kelas ini" },
        { status: 403 }
      );
    }

    // Validasi UTS/UAS
    if (jenis === "MIDTERM" || jenis === "FINAL_EXAM") {
      const existingExam = await prisma.assignment.findFirst({
        where: {
          jenis,
          classSubjectTutor: {
            class: {
              academicYearId: classSubjectTutor.class.academicYear.id,
            },
          },
        },
      });

      if (existingExam) {
        return NextResponse.json(
          {
            message: `Ujian ${
              jenis === "MIDTERM" ? "UTS" : "UAS"
            } sudah dibuat tahun ini.`,
          },
          { status: 400 }
        );
      }
    }

    // Simpan exam
    const newExam = await prisma.assignment.create({
      data: {
        judul,
        deskripsi,
        jenis,
        classSubjectTutorId,
        TanggalMulai: new Date(tanggalMulai),
        TanggalSelesai: new Date(tanggalSelesai),
        batasWaktuMenit: Number(durasiMenit),
        nilaiMaksimal: Number(nilaiMaksimal),
      },
    });

    // 🔔 Kirim notifikasi ke semua siswa di kelas
    const students = classSubjectTutor.class.students;

    const notifications = students.map((student) => ({
      senderId: user.id,
      receiverId: student.userId,
      title: `Ujian Baru: ${judul}`,
      message: `Tutor Anda menambahkan ujian "${judul}" pada mata pelajaran ${classSubjectTutor.subject.namaMapel}.`,
      type: "EXAM",
    }));

    await prisma.notification.createMany({ data: notifications });

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
