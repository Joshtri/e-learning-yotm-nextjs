// File: app/api/siswa/mata-pelajaran/route.js

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

    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: { classId: student.classId },
      include: {
        subject: true,
        tutor: { include: { user: true } },
        learningMaterials: true,
        assignments: {
          include: {
            submissions: {
              where: {
                studentId: student.id,
              },
            },
          },
        },
        quizzes: {
          include: {
            submissions: {
              where: {
                studentId: student.id,
              },
            },
          },
        },
      },
    });

    const mappedSubjects = classSubjectTutors.map((item) => ({
      id: item.subject.id,
      namaMapel: item.subject.namaMapel,
      tutor: item.tutor?.user?.nama || "Tidak ada tutor",
      jumlahMateri: item.learningMaterials?.length || 0,
      jumlahTugas: item.assignments?.length || 0,
      jumlahKuis: item.quizzes?.length || 0,

      materi: (item.learningMaterials || []).map((m) => ({
        id: m.id,
        judul: m.judul,
        konten: m.konten,
        fileUrl: m.fileUrl,
        createdAt: m.createdAt,
      })),

      tugasAktif: (item.assignments || []).map((asg) => ({
        id: asg.id,
        judul: asg.judul,
        jenis: asg.jenis,
        waktuMulai: asg.waktuMulai,
        waktuSelesai: asg.waktuSelesai,
        status:
          asg.submissions.length > 0
            ? "SUDAH_MENGERJAKAN"
            : "BELUM_MENGERJAKAN",
      })),

      kuisAktif: (item.quizzes || []).map((qz) => ({
        id: qz.id,
        judul: qz.judul,
        waktuMulai: qz.waktuMulai,
        waktuSelesai: qz.waktuSelesai,
        status:
          qz.submissions.length > 0
            ? "SUDAH_MENGERJAKAN"
            : "BELUM_MENGERJAKAN",
      })),
    }));

    return NextResponse.json({ success: true, data: mappedSubjects });
  } catch (error) {
    console.error("Gagal mengambil data mata pelajaran siswa:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
