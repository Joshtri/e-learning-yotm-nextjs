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
      questions = [],
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

    // Validasi tanggal
    const startDate = new Date(tanggalMulai);
    const endDate = new Date(tanggalSelesai);

    // Cek apakah tanggal valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { message: "Format tanggal tidak valid" },
        { status: 400 }
      );
    }

    // Cek apakah tanggal selesai lebih besar dari tanggal mulai
    if (endDate <= startDate) {
      return NextResponse.json(
        { message: "Tanggal selesai harus setelah tanggal mulai" },
        { status: 400 }
      );
    }

    // Cek apakah tanggal tidak di masa lalu (opsional, bisa dihapus jika tidak perlu)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      return NextResponse.json(
        { message: "Tanggal mulai tidak boleh di masa lalu" },
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
            message: `Ujian ${jenis === "MIDTERM" ? "UTS" : "UAS"
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
        TanggalMulai: startDate,
        TanggalSelesai: endDate,
        batasWaktuMenit: Number(durasiMenit),
        nilaiMaksimal: Number(nilaiMaksimal),
      },
    });

    // ✅ Simpan Soal (Questions)
    const totalPoin = Number(nilaiMaksimal);
    const poinPerQuestion =
      questions.length > 0 ? Math.floor(totalPoin / questions.length) : 1;

    for (const q of questions) {
      const createdQuestion = await prisma.question.create({
        data: {
          assignmentId: newExam.id, // Link ke assignment
          teks: q.teks,
          image: q.image, // ✅ Simpan gambar soal
          jenis: q.jenis,
          poin: Number(q.poin || poinPerQuestion),
          jawabanBenar: q.jawabanBenar || null,
          pembahasan: q.pembahasan || null,
        },
      });

      if (
        ["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(q.jenis) &&
        q.options?.length
      ) {
        await prisma.answerOption.createMany({
          data: q.options.map((opt, i) => ({
            questionId: createdQuestion.id,
            teks: opt.teks,
            kode: `OPSI_${i}`,
            adalahBenar: String(i) === q.jawabanBenar,
          })),
        });
      }
    }

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
