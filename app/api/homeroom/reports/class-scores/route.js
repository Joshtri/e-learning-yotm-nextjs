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
} from "@/lib/pdf-helper";

//timeout add. 

export const maxDuration = 60;

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
    const academicYearId = searchParams.get("academicYearId");
    const format = searchParams.get("format") || "pdf";

    if (!academicYearId) {
      return NextResponse.json(
        { success: false, message: "Academic year is required" },
        { status: 400 }
      );
    }

    // Get tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // ✅ FETCH STUDENTS ROBUSTLY
    // Common include for fetching submissions
    const submissionsInclude = {
      where: {
        OR: [
          {
            assignment: {
              classSubjectTutor: {
                class: { academicYearId: academicYearId },
              },
            },
          },
          {
            quiz: {
              classSubjectTutor: {
                class: { academicYearId: academicYearId },
              },
            },
          },
        ],
      },
      include: {
        assignment: {
          select: {
            classSubjectTutor: { select: { subjectId: true } },
          },
        },
        quiz: {
          select: {
            classSubjectTutor: { select: { subjectId: true } },
          },
        },
      },
    };

    // Get homeroom class with optimized query
    const kelas = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        academicYearId: academicYearId,
      },
      include: {
        academicYear: true,
        program: true,
      },
    });

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Class not found for this academic year" },
        { status: 404 }
      );
    }

    // 1. Try to get students from history
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
            submissions: submissionsInclude,
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
          submissions: submissionsInclude,
        },
        orderBy: {
          namaLengkap: "asc",
        },
      });
    }

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

    // Organize student data
    const studentsData = students.map((student) => {
      const scores = {};
      let totalScore = 0;
      let subjectCount = 0;

      subjects.forEach((subject) => {
        // 1. Try FinalScore First
        const finalScore = student.FinalScore.find(
          (fs) => fs.subjectId === subject.id
        );

        if (finalScore) {
          scores[subject.id] = finalScore.nilaiAkhir;
          totalScore += finalScore.nilaiAkhir;
          subjectCount++;
        } else {
          // 2. Fallback to calculating average from submissions
          const subjectSubmissions = student.submissions.filter((s) => {
            const sSubjectId =
              s.assignment?.classSubjectTutor?.subjectId ||
              s.quiz?.classSubjectTutor?.subjectId;
            return sSubjectId === subject.id && typeof s.nilai === "number";
          });

          if (subjectSubmissions.length > 0) {
            const sum = subjectSubmissions.reduce(
              (acc, curr) => acc + (curr.nilai || 0),
              0
            );
            const avg = parseFloat(
              (sum / subjectSubmissions.length).toFixed(2)
            ); // Round to 2 decimals
            scores[subject.id] = avg;
            totalScore += avg;
            subjectCount++;
          } else {
            scores[subject.id] = "-";
          }
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

    // Generate report based on format
    if (format === "pdf") {
      return generatePDFClassScores(kelas, subjects, studentsData);
    } else {
      return generateExcelClassScores(kelas, subjects, studentsData);
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

function generatePDFClassScores(kelas, subjects, studentsData) {
  const doc = createPDF("landscape");

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

  // Prepare table headers
  const headers = ["No", "Nama Siswa", "NISN"];
  subjects.forEach((subject) => {
    headers.push(subject.namaMapel);
  });
  headers.push("Rata-rata", "Spiritual", "Sosial");

  // Prepare table data
  const tableData = studentsData.map((student, index) => {
    const row = [index + 1, student.nama, student.nisn];
    subjects.forEach((subject) => {
      row.push(student.scores[subject.id]);
    });
    row.push(student.average, student.spiritual, student.sosial);
    return row;
  });

  createAutoTable(doc, {
    startY: 43,
    head: [headers],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 5, cellPadding: 1 },
    columnStyles: {
      0: { halign: "center", cellWidth: 5 }, // No
      1: { cellWidth: 30 }, // Nama Siswa
      2: { halign: "center", cellWidth: 15 }, // NISN
    },
    headStyles: {
      fillColor: [41, 128, 185],
      halign: "center",
      fontSize: 5, // Match body font size for header consistency or slightly larger
    },
    margin: { top: 10, left: 10, right: 10 },
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

  const pdfBuffer = pdfToBuffer(doc);
  const filename = `rekap-nilai-kelas-${kelas.academicYear?.tahunMulai}-${kelas.academicYear?.semester}.pdf`;

  return createPDFResponse(pdfBuffer, filename);
}

function generateExcelClassScores(kelas, subjects, studentsData) {
  const worksheetData = [
    ["REKAP NILAI SISWA"],
    [],
    [`Kelas: ${kelas.namaKelas}`],
    [`Program: ${kelas.program?.namaPaket || "-"}`],
    [
      `Tahun Ajaran: ${kelas.academicYear?.tahunMulai}/${kelas.academicYear?.tahunSelesai} - ${kelas.academicYear?.semester}`,
    ],
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
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Nilai");

  // Set column widths
  const colWidths = [{ wch: 5 }, { wch: 30 }, { wch: 15 }];
  subjects.forEach(() => colWidths.push({ wch: 12 }));
  colWidths.push({ wch: 12 }, { wch: 12 }, { wch: 12 });
  worksheet["!cols"] = colWidths;

  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=rekap-nilai-kelas-${kelas.academicYear?.tahunMulai}-${kelas.academicYear?.semester}.xlsx`,
    },
  });
}
