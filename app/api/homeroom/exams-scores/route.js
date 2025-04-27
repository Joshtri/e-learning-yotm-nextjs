import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor profile not found" },
        { status: 404 }
      );
    }

    const kelas = await prisma.class.findFirst({
      where: { homeroomTeacherId: tutor.id },
    });

    if (!kelas) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Get all students in this class
    const students = await prisma.student.findMany({
      where: { classId: kelas.id },
      select: {
        id: true,
        namaLengkap: true,
      },
    });

    // Get all subjects taught in this class through ClassSubjectTutor
    const classSubjects = await prisma.classSubjectTutor.findMany({
      where: {
        classId: kelas.id,
      },
      include: {
        subject: true,
        tutor: true,
      },
    });

    // Get all assignments for this class
    const assignments = await prisma.assignment.findMany({
      where: {
        classSubjectTutor: {
          classId: kelas.id,
        },
        jenis: {
          in: ["DAILY_TEST", "START_SEMESTER_TEST", "MIDTERM", "FINAL_EXAM"],
        },
      },
      include: {
        submissions: {
          include: {
            student: {
              select: { id: true },
            },
          },
        },
        classSubjectTutor: {
          include: {
            subject: {
              select: { namaMapel: true },
            },
          },
        },
      },
    });

    // Structure the data by student and subject
    const result = students.map((student) => {
      // First create a map with all subjects taught in this class
      const subjectsMap = {};
      classSubjects.forEach((cs) => {
        subjectsMap[cs.subject.namaMapel] = {
          mataPelajaran: cs.subject.namaMapel,
          DAILY_TEST: null,
          START_SEMESTER_TEST: null,
          MIDTERM: null,
          FINAL_EXAM: null,
        };
      });

      // Then populate with actual submission data if available
      const studentSubmissions = assignments.flatMap((assignment) => {
        return assignment.submissions
          .filter((sub) => sub.student.id === student.id)
          .map((sub) => ({
            mataPelajaran: assignment.classSubjectTutor.subject.namaMapel,
            jenis: assignment.jenis,
            nilai: sub.nilai,
          }));
      });

      studentSubmissions.forEach((sub) => {
        if (subjectsMap[sub.mataPelajaran]) {
          subjectsMap[sub.mataPelajaran][sub.jenis] = sub.nilai;
        }
      });

      return {
        studentId: student.id,
        namaLengkap: student.namaLengkap,
        mapel: Object.values(subjectsMap),
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Gagal memuat rekap nilai ujian:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat rekap nilai ujian" },
      { status: 500 }
    );
  }
}
