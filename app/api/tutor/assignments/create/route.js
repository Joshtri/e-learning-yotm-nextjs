import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function POST(req) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Cari tutorId berdasarkan userId
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Data tutor tidak ditemukan" },
        { status: 404 }
      );
    }

    const {
      judul,
      deskripsi,
      classSubjectTutorId,
      waktuMulai,
      waktuSelesai,
      batasWaktuMenit,
      nilaiMaksimal,
      jenis,
      questionsFromPdf,
    } = await req.json();

    if (!judul || !classSubjectTutorId || !waktuMulai || !waktuSelesai) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    console.log("User ID:", user.id);
    console.log("Tutor ID:", tutor.id);
    console.log("ClassSubjectTutor ID:", classSubjectTutorId);

    // Ambil info class + subject + semua siswa
    const classSubjectTutor = await prisma.classSubjectTutor.findFirst({
      where: { id: classSubjectTutorId, tutorId: tutor.id },
      include: {
        class: {
          include: { students: { select: { userId: true } } },
        },
        subject: true,
      },
    });

    if (!classSubjectTutor) {
      console.log("ClassSubjectTutor not found for given ID and tutorId");
      return NextResponse.json(
        {
          success: false,
          message: "Anda tidak memiliki akses ke kelas-mapel ini",
        },
        { status: 403 }
      );
    }

    // Simpan tugas
    const assignment = await prisma.assignment.create({
      data: {
        judul,
        deskripsi,
        jenis: jenis || "EXERCISE", // Default ke EXERCISE jika tidak diberikan
        classSubjectTutorId,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        batasWaktuMenit: batasWaktuMenit ? Number(batasWaktuMenit) : undefined,
        nilaiMaksimal: nilaiMaksimal ? Number(nilaiMaksimal) : undefined,
        questionsFromPdf: questionsFromPdf || null, // Store PDF as base64
      },
    });

    // Kirim notifikasi ke semua siswa di kelas
    const studentUserIds = classSubjectTutor.class.students.map(
      (s) => s.userId
    );
    const notifikasiData = studentUserIds.map((studentId) => ({
      senderId: user.id,
      receiverId: studentId,
      title: `Tugas Baru: ${judul}`,
      message: `Tutor Anda memberikan tugas "${judul}" untuk mata pelajaran ${classSubjectTutor.subject.namaMapel}.`,
      type: "ASSIGNMENT",
      isRead: false,
      createdAt: new Date(),
    }));

    await prisma.notification.createMany({
      data: notifikasiData,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, data: assignment });
  } catch (error) {
    console.error("Gagal membuat tugas:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
