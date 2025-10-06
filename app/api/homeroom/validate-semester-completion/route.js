import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export const maxDuration = 60; // 60 seconds timeout

export async function GET(request) {
  try {
    const user = await getUserFromCookie();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Cari tutor berdasarkan user login
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // Cari kelas yang di-wali oleh homeroom teacher
    // Ambil kelas terbaru berdasarkan academic year (yang masih punya siswa aktif)
    const kelas = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        students: {
          some: {
            status: "ACTIVE",
          },
        },
      },
      include: {
        academicYear: true,
        program: true,
        students: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            namaLengkap: true,
            nisn: true,
          },
        },
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "asc" } }, // GANJIL dulu baru GENAP
      ],
    });

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil semua mata pelajaran di kelas ini
    const subjects = await prisma.classSubjectTutor.findMany({
      where: { classId: kelas.id },
      include: {
        subject: true,
      },
      distinct: ["subjectId"],
    });

    const subjectList = subjects.map((cst) => ({
      id: cst.subject.id,
      nama: cst.subject.namaMapel,
    }));

    // Validasi per siswa
    const validationResults = await Promise.all(
      kelas.students.map(async (student) => {
        const issues = [];

        // 1. Validasi UTS (MIDTERM) per mata pelajaran
        const utsSubmissions = await prisma.submission.findMany({
          where: {
            studentId: student.id,
            assignment: {
              jenis: "MIDTERM",
              classSubjectTutor: {
                classId: kelas.id,
              },
            },
            status: "GRADED", // Harus sudah dinilai
          },
          include: {
            assignment: {
              include: {
                classSubjectTutor: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        });

        const utsSubjects = utsSubmissions.map(
          (sub) => sub.assignment.classSubjectTutor.subject.id
        );

        // Cek mata pelajaran mana yang belum ada UTS
        const missingUTS = subjectList.filter(
          (subj) => !utsSubjects.includes(subj.id)
        );
        if (missingUTS.length > 0) {
          issues.push({
            type: "UTS",
            message: `Belum ada nilai UTS untuk: ${missingUTS
              .map((s) => s.nama)
              .join(", ")}`,
            missing: missingUTS,
          });
        }

        // 2. Validasi UAS (FINAL_EXAM) per mata pelajaran
        const uasSubmissions = await prisma.submission.findMany({
          where: {
            studentId: student.id,
            assignment: {
              jenis: "FINAL_EXAM",
              classSubjectTutor: {
                classId: kelas.id,
              },
            },
            status: "GRADED",
          },
          include: {
            assignment: {
              include: {
                classSubjectTutor: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        });

        const uasSubjects = uasSubmissions.map(
          (sub) => sub.assignment.classSubjectTutor.subject.id
        );

        // Cek mata pelajaran mana yang belum ada UAS
        const missingUAS = subjectList.filter(
          (subj) => !uasSubjects.includes(subj.id)
        );
        if (missingUAS.length > 0) {
          issues.push({
            type: "UAS",
            message: `Belum ada nilai UAS untuk: ${missingUAS
              .map((s) => s.nama)
              .join(", ")}`,
            missing: missingUAS,
          });
        }

        // 3. Validasi BehaviorScore
        const behaviorScore = await prisma.behaviorScore.findUnique({
          where: {
            studentId_classId_academicYearId: {
              studentId: student.id,
              classId: kelas.id,
              academicYearId: kelas.academicYearId,
            },
          },
        });

        if (!behaviorScore) {
          issues.push({
            type: "BEHAVIOR",
            message: "Belum ada nilai sikap & kehadiran",
            missing: null,
          });
        }

        return {
          studentId: student.id,
          namaLengkap: student.namaLengkap,
          nisn: student.nisn,
          isValid: issues.length === 0,
          issues,
        };
      })
    );

    const allValid = validationResults.every((r) => r.isValid);

    return NextResponse.json({
      success: true,
      data: {
        classInfo: {
          id: kelas.id,
          namaKelas: kelas.namaKelas,
          program: kelas.program?.namaPaket,
          academicYear: {
            id: kelas.academicYear.id,
            tahunMulai: kelas.academicYear.tahunMulai,
            tahunSelesai: kelas.academicYear.tahunSelesai,
            semester: kelas.academicYear.semester,
          },
        },
        validation: {
          allValid,
          totalStudents: kelas.students.length,
          validStudents: validationResults.filter((r) => r.isValid).length,
          invalidStudents: validationResults.filter((r) => !r.isValid).length,
        },
        students: validationResults,
        requiredSubjects: subjectList,
      },
    });
  } catch (error) {
    console.error("Error validating semester completion:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
