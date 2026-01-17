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
  sanitizeFilename,
} from "@/lib/pdf-helper";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");
    const classId = searchParams.get("classId");
    const format = searchParams.get("format") || "pdf";

    if (!academicYearId) {
      return NextResponse.json(
        { success: false, message: "Academic year is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause = {
      academicYearId: academicYearId,
    };

    if (classId && classId !== "all") {
      whereClause.id = classId;
    }

    // Get classes
    const classes = await prisma.class.findMany({
      where: whereClause,
      include: {
        academicYear: true,
        program: true,
        homeroomTeacher: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { namaKelas: "asc" },
    });

    if (classes.length === 0) {
      return NextResponse.json(
        { success: false, message: "No classes found" },
        { status: 404 }
      );
    }

    const classesData = [];

    for (const kelas of classes) {
      // Get all subjects for this class's program
      const programSubjects = await prisma.programSubject.findMany({
        where: { programId: kelas.programId },
        include: {
          subject: true,
        },
        orderBy: {
          subject: { namaMapel: "asc" },
        },
      });

      const subjects = programSubjects.map((ps) => ps.subject);

      // ✅ FETCH STUDENTS ROBUSTLY
      // 1. Try to get students from history (for past semesters/accurate historical data)
      const classHistory = await prisma.studentClassHistory.findMany({
        where: {
          classId: kelas.id,
          academicYearId: academicYearId,
        },
        include: {
          student: {
            include: {
              FinalScore: {
                where: { tahunAjaranId: academicYearId },
                include: { subject: true },
              },
              BehaviorScore: {
                where: { academicYearId: academicYearId },
              },
            },
          },
        },
        orderBy: {
          student: { namaLengkap: "asc" },
        },
      });

      let students = classHistory.map((h) => h.student);

      // 2. Fallback: If no history (e.g. current active semester), get current active students
      if (students.length === 0) {
        students = await prisma.student.findMany({
          where: {
            classId: kelas.id,
            status: "ACTIVE",
          },
          include: {
            FinalScore: {
              where: { tahunAjaranId: academicYearId },
              include: { subject: true },
            },
            BehaviorScore: {
              where: { academicYearId: academicYearId },
            },
          },
          orderBy: {
            namaLengkap: "asc",
          },
        });
      }

      // Organize student data
      const studentsData = students.map((student) => {
        const scores = {};
        let totalScore = 0;
        let subjectCount = 0;

        subjects.forEach((subject) => {
          const finalScore = student.FinalScore.find(
            (fs) => fs.subjectId === subject.id
          );
          if (finalScore) {
            scores[subject.id] = finalScore.nilaiAkhir;
            totalScore += finalScore.nilaiAkhir;
            subjectCount++;
          } else {
            scores[subject.id] = "-";
          }
        });

        const average =
          subjectCount > 0 ? (totalScore / subjectCount).toFixed(2) : "-";

        const behaviorScore = student.BehaviorScore[0];

        return {
          nama: student.namaLengkap,
          nisn: student.nisn,
          scores,
          average,
          spiritual: behaviorScore?.spiritual || "-",
          sosial: behaviorScore?.sosial || "-",
        };
      });

      classesData.push({
        kelas,
        subjects,
        studentsData,
      });
    }

    // Generate report based on format
    if (format === "pdf") {
      return generatePDFClassScores(classesData);
    } else {
      return generateExcelClassScores(classesData);
    }
  } catch (error) {
    console.error("Error generating class scores report:", error);
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

function generatePDFClassScores(classesData) {
  const doc = createPDF("landscape");

  classesData.forEach((data, index) => {
    const { kelas, subjects, studentsData } = data;

    // Add new page for each class except the first
    if (index > 0) {
      doc.addPage();
    }

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    addText(doc, "REKAP NILAI SISWA", 148, 15, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    addText(doc, `Kelas: ${kelas.namaKelas}`, 14, 25);
    addText(doc, `Program: ${kelas.program?.namaPaket || "-"}`, 14, 31);
    addText(
      doc,
      `Tahun Ajaran: ${kelas.academicYear?.tahunMulai}/${kelas.academicYear?.tahunSelesai} - ${kelas.academicYear?.semester}`,
      14,
      37
    );
    addText(
      doc,
      `Wali Kelas: ${kelas.homeroomTeacher?.namaLengkap || "-"}`,
      14,
      43
    );

    // Prepare table headers
    const headers = ["No", "Nama Siswa", "NISN"];
    subjects.forEach((subject) => {
      headers.push(subject.namaMapel);
    });
    headers.push("Rata-rata", "Spiritual", "Sosial");

    // Prepare table data
    const tableData = studentsData.map((student, idx) => {
      const row = [idx + 1, student.nama, student.nisn];
      subjects.forEach((subject) => {
        row.push(student.scores[subject.id]);
      });
      row.push(student.average, student.spiritual, student.sosial);
      return row;
    });

    createAutoTable(doc, {
      startY: 49,
      head: [headers],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        halign: "center",
        fontSize: 7,
      },
      styles: { fontSize: 6, cellPadding: 1.5 },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { cellWidth: 35 },
        2: { halign: "center", cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    addText(
      doc,
      `Dicetak pada: ${new Date().toLocaleString("id-ID")}`,
      14,
      finalY
    );
  });

  const pdfBuffer = pdfToBuffer(doc);
  const academicYear = classesData[0]?.kelas?.academicYear;
  const filename = sanitizeFilename(
    `rekap-nilai-${academicYear?.tahunMulai}-${academicYear?.semester}.pdf`
  );

  return createPDFResponse(pdfBuffer, filename);
}

function generateExcelClassScores(classesData) {
  const workbook = XLSX.utils.book_new();

  classesData.forEach((data) => {
    const { kelas, subjects, studentsData } = data;

    const worksheetData = [
      ["REKAP NILAI SISWA"],
      [],
      [`Kelas: ${kelas.namaKelas}`],
      [`Program: ${kelas.program?.namaPaket || "-"}`],
      [
        `Tahun Ajaran: ${kelas.academicYear?.tahunMulai}/${kelas.academicYear?.tahunSelesai} - ${kelas.academicYear?.semester}`,
      ],
      [`Wali Kelas: ${kelas.homeroomTeacher?.namaLengkap || "-"}`],
      [],
    ];

    // Headers
    const headers = ["No", "Nama Siswa", "NISN"];
    subjects.forEach((subject) => {
      headers.push(subject.namaMapel);
    });
    headers.push("Rata-rata", "Spiritual", "Sosial");
    worksheetData.push(headers);

    // Data
    studentsData.forEach((student, index) => {
      const row = [index + 1, student.nama, student.nisn];
      subjects.forEach((subject) => {
        row.push(student.scores[subject.id]);
      });
      row.push(student.average, student.spiritual, student.sosial);
      worksheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = [{ wch: 5 }, { wch: 30 }, { wch: 15 }];
    subjects.forEach(() => colWidths.push({ wch: 12 }));
    colWidths.push({ wch: 12 }, { wch: 12 }, { wch: 12 });
    worksheet["!cols"] = colWidths;

    // Sanitize sheet name (max 31 chars, no special chars)
    const sheetName = kelas.namaKelas
      .substring(0, 31)
      .replace(/[:\\\/?*\[\]]/g, "");
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  const academicYear = classesData[0]?.kelas?.academicYear;
  const filename = sanitizeFilename(
    `rekap-nilai-${academicYear?.tahunMulai}-${academicYear?.semester}.xlsx`
  );

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
