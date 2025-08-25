import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET() {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Ambil data siswa berdasarkan userId
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: { class: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil daftar mata pelajaran berdasarkan kelas siswa
    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: { classId: student.classId },
      include: {
        subject: true,
        learningMaterials: true,
      },
    });

    const mapped = classSubjectTutors.map((item) => ({
      mapelId: item.subject.id,
      namaMapel: item.subject.namaMapel,
      materi: (item.learningMaterials || []).map((m) => ({
        id: m.id,
        judul: m.judul,
        pertemuan: m.pertemuan || "1", // Show meeting number
        tipeMateri: m.tipeMateri, // Fixed: was 'tipe', should be 'tipeMateri'
        fileUrl: m.fileUrl,
        createdAt: m.createdAt,
      })),
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error("Gagal mengambil materi pembelajaran:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
