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
    // Nilai hanya ditampilkan jika wali kelas sudah menyimpan nilai akhir (FinalScore)
    const reportData = {};

    // Bangun daftar tahun ajaran & mata pelajaran yang sudah ada FinalScore
    const finalScoreKeys = new Set();

    finalScores.forEach(fs => {
      const yearStr = `${fs.academicYear.tahunMulai}/${fs.academicYear.tahunSelesai} - ${fs.academicYear.semester}`;
      if (!reportData[yearStr]) {
        reportData[yearStr] = {
          academicYear: yearStr,
          academicYearId: fs.academicYear.id,
          subjects: {},
          behavior: null,
        };
      }
      const subName = fs.subject.namaMapel;
      if (!reportData[yearStr].subjects[subName]) {
        reportData[yearStr].subjects[subName] = { name: subName, final: null, skill: null, exams: [] };
      }
      reportData[yearStr].subjects[subName].final = fs.nilaiAkhir;
      finalScoreKeys.add(`${yearStr}::${subName}`);
    });

    // Jika tidak ada FinalScore sama sekali, langsung return kosong
    if (finalScores.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Process Behavior Scores - hanya untuk tahun ajaran yang ada FinalScore-nya
    behaviorScores.forEach(bs => {
      const yearStr = `${bs.academicYear.tahunMulai}/${bs.academicYear.tahunSelesai} - ${bs.academicYear.semester}`;
      if (reportData[yearStr]) {
        reportData[yearStr].behavior = {
          spiritual: bs.spiritual,
          social: bs.sosial,
        };
      }
    });

    // Process Exam Submissions - hanya untuk mata pelajaran yang sudah ada FinalScore
    examSubmissions.forEach(sub => {
      const yearInfo = sub.assignment.classSubjectTutor.class.academicYear;
      const yearStr = `${yearInfo.tahunMulai}/${yearInfo.tahunSelesai} - ${yearInfo.semester}`;
      const subName = sub.assignment.classSubjectTutor.subject.namaMapel;
      const key = `${yearStr}::${subName}`;

      if (finalScoreKeys.has(key) && reportData[yearStr]?.subjects[subName]) {
        reportData[yearStr].subjects[subName].exams.push({
          title: sub.assignment.judul,
          jenis: sub.assignment.jenis,
          nilai: sub.nilai,
          nilaiMaksimal: sub.assignment.nilaiMaksimal,
        });
      }
    });

    // Process Skill Scores - hanya untuk mata pelajaran yang sudah ada FinalScore
    skillScores.forEach(ss => {
      const subName = ss.subject.namaMapel;
      const yearsWithThisSubject = Object.values(reportData)
        .filter(year => year.subjects[subName]);

      if (yearsWithThisSubject.length > 0) {
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
