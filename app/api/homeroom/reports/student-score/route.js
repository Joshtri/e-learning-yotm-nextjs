import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  createPDF,
  addText,
  createAutoTable,
  pdfToBuffer,
  createPDFResponse,
  getNilaiHuruf,
  getPredikat,
} from "@/lib/pdf-helper";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const academicYearId = searchParams.get("academicYearId");
    const format = searchParams.get("format") || "pdf";

    if (!studentId || !academicYearId) {
      return NextResponse.json(
        { success: false, message: "Student ID and Academic year are required" },
        { status: 400 }
      );
    }

    // Get student with all scores
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        class: {
          include: {
            academicYear: true,
            program: true,
          },
        },
        FinalScore: {
          where: { tahunAjaranId: academicYearId },
          include: {
            subject: true,
          },
          orderBy: {
            subject: { namaMapel: "asc" },
          },
        },
        BehaviorScore: {
          where: { academicYearId: academicYearId },
        },
        Attendance: {
          where: {
            academicYearId: academicYearId,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // Get academic year
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    // Calculate attendance summary
    const attendanceSummary = {
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpha: 0,
    };

    student.Attendance.forEach((att) => {
      if (att.status === "PRESENT") attendanceSummary.hadir++;
      else if (att.status === "SICK") attendanceSummary.sakit++;
      else if (att.status === "EXCUSED") attendanceSummary.izin++;
      else if (att.status === "ABSENT") attendanceSummary.alpha++;
    });

    const totalAttendance =
      attendanceSummary.hadir +
      attendanceSummary.sakit +
      attendanceSummary.izin +
      attendanceSummary.alpha;

    // Calculate average score
    const totalScore = student.FinalScore.reduce(
      (sum, score) => sum + score.nilaiAkhir,
      0
    );
    const averageScore =
      student.FinalScore.length > 0
        ? (totalScore / student.FinalScore.length).toFixed(2)
        : 0;

    const reportData = {
      student: {
        nama: student.namaLengkap,
        nisn: student.nisn,
        nis: student.nis,
        kelas: student.class?.namaKelas,
        program: student.class?.program?.namaPaket,
      },
      academicYear: {
        tahun: `${academicYear?.tahunMulai}/${academicYear?.tahunSelesai}`,
        semester: academicYear?.semester,
      },
      scores: student.FinalScore,
      averageScore,
      behaviorScore: student.BehaviorScore[0] || null,
      attendance: attendanceSummary,
      totalAttendance,
    };

    // Generate report based on format
    if (format === "pdf") {
      return generatePDFStudentScore(reportData);
    } else {
      return generateExcelStudentScore(reportData);
    }
  } catch (error) {
    console.error("Error generating student score report:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

function generatePDFStudentScore(data) {
  const doc = createPDF();

  // Header - Rapor Style
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  addText(doc, "RAPOR SISWA", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  addText(
    doc,
    `Tahun Ajaran ${data.academicYear.tahun} - Semester ${data.academicYear.semester}`,
    105,
    28,
    { align: "center" }
  );

  // Student Information
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  addText(doc, "DATA SISWA", 14, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  addText(doc, `Nama`, 14, 48);
  addText(doc, `: ${data.student.nama}`, 50, 48);
  addText(doc, `NISN`, 14, 54);
  addText(doc, `: ${data.student.nisn}`, 50, 54);
  addText(doc, `NIS`, 14, 60);
  addText(doc, `: ${data.student.nis || "-"}`, 50, 60);
  addText(doc, `Kelas`, 14, 66);
  addText(doc, `: ${data.student.kelas}`, 50, 66);
  addText(doc, `Program`, 14, 72);
  addText(doc, `: ${data.student.program}`, 50, 72);

  // Academic Scores
  doc.setFont("helvetica", "bold");
  addText(doc, "NILAI AKADEMIK", 14, 85);

  const scoreData = data.scores.map((score, index) => [
    index + 1,
    score.subject.namaMapel,
    score.nilaiAkhir.toFixed(2),
    getNilaiHuruf(score.nilaiAkhir),
    getPredikat(score.nilaiAkhir),
  ]);

  createAutoTable(doc, {
    startY: 90,
    head: [["No", "Mata Pelajaran", "Nilai", "Huruf", "Predikat"]],
    body: scoreData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], halign: "center" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 80 },
      2: { halign: "center", cellWidth: 25 },
      3: { halign: "center", cellWidth: 20 },
      4: { halign: "center", cellWidth: 35 },
    },
  });

  let currentY = doc.lastAutoTable.finalY + 10;

  // Average Score
  doc.setFont("helvetica", "bold");
  addText(doc, `Rata-rata Nilai: ${data.averageScore}`, 14, currentY);
  currentY += 10;

  // Behavior Scores
  doc.setFont("helvetica", "bold");
  addText(doc, "NILAI SIKAP", 14, currentY);
  currentY += 6;

  doc.setFont("helvetica", "normal");
  if (data.behaviorScore) {
    addText(
      doc,
      `Spiritual: ${data.behaviorScore.spiritual} | Sosial: ${data.behaviorScore.sosial}`,
      14,
      currentY
    );
  } else {
    addText(doc, "Belum ada penilaian sikap", 14, currentY);
  }
  currentY += 10;

  // Attendance
  doc.setFont("helvetica", "bold");
  addText(doc, "KEHADIRAN", 14, currentY);
  currentY += 6;

  doc.setFont("helvetica", "normal");
  addText(
    doc,
    `Hadir: ${data.attendance.hadir} | Sakit: ${data.attendance.sakit} | Izin: ${data.attendance.izin} | Alpha: ${data.attendance.alpha}`,
    14,
    currentY
  );
  addText(doc, `Total Hari: ${data.totalAttendance}`, 14, currentY + 6);

  // Footer
  currentY += 20;
  doc.setFontSize(9);
  addText(
    doc,
    `Dicetak pada: ${new Date().toLocaleString("id-ID")}`,
    14,
    currentY
  );

  const pdfBuffer = pdfToBuffer(doc);
  const filename = `rapor-${data.student.nama.replace(/\s+/g, "-")}.pdf`;

  return createPDFResponse(pdfBuffer, filename);
}

function generateExcelStudentScore(data) {
  const worksheetData = [
    ["RAPOR SISWA"],
    [
      `Tahun Ajaran ${data.academicYear.tahun} - Semester ${data.academicYear.semester}`,
    ],
    [],
    ["DATA SISWA"],
    ["Nama", data.student.nama],
    ["NISN", data.student.nisn],
    ["NIS", data.student.nis || "-"],
    ["Kelas", data.student.kelas],
    ["Program", data.student.program],
    [],
    ["NILAI AKADEMIK"],
    ["No", "Mata Pelajaran", "Nilai", "Huruf", "Predikat"],
  ];

  data.scores.forEach((score, index) => {
    worksheetData.push([
      index + 1,
      score.subject.namaMapel,
      score.nilaiAkhir,
      getNilaiHuruf(score.nilaiAkhir),
      getPredikat(score.nilaiAkhir),
    ]);
  });

  worksheetData.push(
    [],
    ["Rata-rata Nilai", data.averageScore],
    [],
    ["NILAI SIKAP"]
  );

  if (data.behaviorScore) {
    worksheetData.push(
      ["Spiritual", data.behaviorScore.spiritual],
      ["Sosial", data.behaviorScore.sosial]
    );
  } else {
    worksheetData.push(["Belum ada penilaian sikap"]);
  }

  worksheetData.push(
    [],
    ["KEHADIRAN"],
    ["Hadir", data.attendance.hadir],
    ["Sakit", data.attendance.sakit],
    ["Izin", data.attendance.izin],
    ["Alpha", data.attendance.alpha],
    ["Total Hari", data.totalAttendance]
  );

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");

  // Set column widths
  worksheet["!cols"] = [{ wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];

  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=rapor-${data.student.nama.replace(
        /\s+/g,
        "-"
      )}.xlsx`,
    },
  });
}

