import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

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
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    // 1. Ambil data nilai
    const finalScores = await prisma.finalScore.findMany({
      where: { studentId: student.id },
      include: {
        subject: true,
        academicYear: true,
      },
    });

    const skillScores = await prisma.skillScore.findMany({
      where: { studentId: student.id },
      include: {
        subject: true,
      },
    });

    const behaviorScores = await prisma.behaviorScore.findMany({
      where: { studentId: student.id },
      include: {
        academicYear: true,
      },
    });

    // 2. Ambil nilai ujian
    const examSubmissions = await prisma.submission.findMany({
      where: {
        studentId: student.id,
        status: "GRADED",
        assignment: {
          jenis: { in: ["DAILY_TEST", "START_SEMESTER_TEST", "MIDTERM", "FINAL_EXAM"] }
        }
      },
      include: {
        assignment: {
          include: {
            classSubjectTutor: {
              include: {
                subject: true,
                class: {
                  include: { academicYear: true }
                }
              }
            }
          }
        }
      }
    });

    // 3. Kelompokkan data
    const reportData = {};

    const ensureYear = (year) => {
      const yearStr = `${year.tahunMulai}/${year.tahunSelesai} - ${year.semester}`;
      if (!reportData[yearStr]) {
        reportData[yearStr] = {
          academicYear: yearStr,
          academicYearId: year.id,
          subjects: {},
          behavior: null,
        };
      }
      return reportData[yearStr];
    };

    // Process Final Scores
    finalScores.forEach(fs => {
      const year = ensureYear(fs.academicYear);
      const subName = fs.subject.namaMapel;
      if (!year.subjects[subName]) year.subjects[subName] = { name: subName, final: null, skill: null, exams: [] };
      year.subjects[subName].final = fs.nilaiAkhir;
    });

    // Process Behavior Scores
    behaviorScores.forEach(bs => {
      const year = ensureYear(bs.academicYear);
      year.behavior = {
        spiritual: bs.spiritual,
        social: bs.sosial,
      };
    });

    // Process Exam Submissions
    examSubmissions.forEach(sub => {
      const yearInfo = sub.assignment.classSubjectTutor.class.academicYear;
      const year = ensureYear(yearInfo);
      const subName = sub.assignment.classSubjectTutor.subject.namaMapel;
      if (!year.subjects[subName]) year.subjects[subName] = { name: subName, final: null, skill: null, exams: [] };
      
      year.subjects[subName].exams.push({
        title: sub.assignment.judul,
        jenis: sub.assignment.jenis,
        nilai: sub.nilai,
        nilaiMaksimal: sub.assignment.nilaiMaksimal,
      });
    });

    // Process Skill Scores (Lacking academicYearId, assign to current/latest year for that subject in reportData)
    skillScores.forEach(ss => {
      const subName = ss.subject.namaMapel;
      // We look for this subject in any academic year available in reportData
      // and update the skill score there. If multiple years have this subject,
      // it's a bit ambiguous, but we'll try to match it or at least put it in the latest.
      const yearsWithThisSubject = Object.values(reportData)
        .filter(year => year.subjects[subName]);
      
      if (yearsWithThisSubject.length > 0) {
        // Find latest year (based on yearStr)
        const latestYear = yearsWithThisSubject.sort((a, b) => b.academicYear.localeCompare(a.academicYear))[0];
        latestYear.subjects[subName].skill = ss.nilai;
      }
    });

    // Convert map to sorted array
    const sortedResult = Object.values(reportData).sort((a, b) => b.academicYear.localeCompare(a.academicYear));
    
    // Convert subjects map to array
    sortedResult.forEach(year => {
      year.subjects = Object.values(year.subjects).sort((a, b) => a.name.localeCompare(b.name));
    });

    return NextResponse.json({
      success: true,
      data: sortedResult
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
