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
      include: {
        class: {
          include: {
            academicYear: true,
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

    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: { classId: student.classId },
      include: {
        subject: true,
        tutor: { include: { user: true } },
        learningMaterials: true,
        assignments: {
          where: { jenis: "EXERCISE" },
          include: {
            questions: true,
            submissions: {
              where: { studentId: student.id },
              select: {
                nilai: true,
                feedback: true,
              },
            },
          },
        },
        class: {
          include: {
            academicYear: true,
          },
        },
      },
    });

    const mappedSubjects = classSubjectTutors.map((item) => ({
      id: item.subject.id,
      namaMapel: item.subject.namaMapel,
      tutor: item.tutor?.user?.nama || "Tidak ada tutor",
      jumlahMateri: item.learningMaterials?.length || 0,
      jumlahTugas: item.assignments?.length || 0, // ✅ tinggal hitung assignments langsung
      academicYear: student.class?.academicYear
        ? `${student.class.academicYear.tahunMulai}/${student.class.academicYear.tahunSelesai}`
        : null,
      academicYearId: student.class?.academicYear?.id || null,
      classId: student.class?.id || null,
      className: student.class?.namaKelas || null,

      materi: (item.learningMaterials || []).map((m) => ({
        id: m.id,
        judul: m.judul,
        konten: m.konten,
        fileUrl: m.fileUrl,
        createdAt: m.createdAt,
      })),

      tugasAktif: (item.assignments || []).map((asg) => {
        const submission = asg.submissions[0]; // Ambil submission pertama (satu siswa = satu submission)
        return {
          id: asg.id,
          judul: asg.judul,
          jenis: asg.jenis,
          waktuMulai: asg.waktuMulai,
          waktuSelesai: asg.waktuSelesai,
          jumlahSoal: asg.questions?.length || 0,
          nilai: submission?.nilai ?? null,
          feedback: submission?.feedback ?? null,
          status: submission ? "SUDAH_MENGERJAKAN" : "BELUM_MENGERJAKAN",
        };
      }),
    }));

    const filteredSubjectsWithTasks = mappedSubjects.filter(
      (subject) => subject.tugasAktif.length > 0
    );

    return NextResponse.json({
      success: true,
      data: filteredSubjectsWithTasks,
    });
  } catch (error) {
    console.error("Gagal mengambil data mata pelajaran siswa:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
