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

    const {
      judul,
      deskripsi,
      classSubjectTutorId,
      waktuMulai,
      waktuSelesai,
      batasWaktuMenit,
      nilaiMaksimal,
    } = await req.json();

    if (!judul || !classSubjectTutorId || !waktuMulai || !waktuSelesai) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Ambil info class + subject + semua siswa
    const classSubjectTutor = await prisma.classSubjectTutor.findFirst({
      where: { id: classSubjectTutorId, tutorId: user.id },
      include: {
        class: {
          include: { students: { select: { userId: true } } },
        },
        subject: true,
      },
    });

    if (!classSubjectTutor) {
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
        jenis: "EXERCISE",
        classSubjectTutorId,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        batasWaktuMenit,
        nilaiMaksimal,
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
      message: `Tutor Anda memberikan tugas "${judul}" untuk mata pelajaran ${classSubjectTutor.subject.nama}.`,
      type: "ASSIGNMENT",
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
