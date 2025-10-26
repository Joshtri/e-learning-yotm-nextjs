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

export async function GET(request) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");
    const format = searchParams.get("format") || "pdf";

    if (!academicYearId || !classId || !subjectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Academic year, class, and subject are required",
        },
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

    // Verify tutor teaches this class-subject AND it matches the academic year
    const classSubjectTutor = await prisma.classSubjectTutor.findFirst({
      where: {
        tutorId: tutor.id,
        classId: classId,
        subjectId: subjectId,
        class: {
          academicYearId: academicYearId, // ✅ FILTER: Class must be from selected academic year!
        },
      },
      include: {
        class: {
          include: {
            academicYear: true,
            program: true,
          },
        },
        subject: true,
        tutor: true,
      },
    });

    if (!classSubjectTutor) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't teach this subject in this class for the selected academic year",
        },
        { status: 403 }
      );
    }

    // ✅ VALIDATION: Ensure class is from the correct academic year
    if (classSubjectTutor.class.academicYearId !== academicYearId) {
      return NextResponse.json(
        {
          success: false,
          message: "Class does not match the selected academic year",
        },
        { status: 400 }
      );
    }

    // ✅ Get students from class history for this academic year
    // Use StudentClassHistory to get students who were in this class during this academic year
    const classHistory = await prisma.studentClassHistory.findMany({
      where: {
        classId: classId,
        academicYearId: academicYearId,
      },
      include: {
        student: {
          include: {
            FinalScore: {
              where: {
                subjectId: subjectId,
                tahunAjaranId: academicYearId,
              },
            },
            submissions: {
              where: {
                assignment: {
                  classSubjectTutorId: classSubjectTutor.id,
                },
              },
              include: {
                assignment: {
                  select: {
                    judul: true,
                    jenis: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          namaLengkap: "asc",
        },
      },
    });

    // Extract students from history
    let students = classHistory.map((history) => history.student);

    // ✅ FALLBACK: If no history (current academic year), get current students in class
    if (students.length === 0) {
      students = await prisma.student.findMany({
        where: {
          classId: classId,
          status: "ACTIVE",
        },
        include: {
          FinalScore: {
            where: {
              subjectId: subjectId,
              tahunAjaranId: academicYearId,
            },
          },
          submissions: {
            where: {
              assignment: {
                classSubjectTutorId: classSubjectTutor.id,
              },
            },
            include: {
              assignment: {
                select: {
                  judul: true,
                  jenis: true,
                },
              },
            },
          },
        },
        orderBy: {
          namaLengkap: "asc",
        },
      });
    }

    // ✅ DEBUG: Log untuk troubleshooting
    console.log("\n========== DEBUG Report Generation ==========");
    console.log("Academic Year ID:", academicYearId);
    console.log("Academic Year:", `${classSubjectTutor.class.academicYear.tahunMulai}/${classSubjectTutor.class.academicYear.tahunSelesai} - ${classSubjectTutor.class.academicYear.semester}`);
    console.log("Class:", classSubjectTutor.class.namaKelas, `(ID: ${classId})`);
    console.log("Subject:", classSubjectTutor.subject.namaMapel, `(ID: ${subjectId})`);
    console.log("Students found:", students.length);
    console.log("Using history?:", classHistory.length > 0 ? `Yes (${classHistory.length} records)` : "No (using current students)");

    // Get all assignments for this class-subject
    const assignments = await prisma.assignment.findMany({
      where: {
        classSubjectTutorId: classSubjectTutor.id,
      },
      orderBy: {
        TanggalMulai: "asc",
      },
      select: {
        id: true,
        judul: true,
        jenis: true,
        nilaiMaksimal: true,
      },
    });

    console.log("Assignments found:", assignments.length);
    console.log("============================================\n");

    // Organize student data
    const studentsData = students.map((student) => {
      const assignmentScores = {};

      // Map assignment scores
      assignments.forEach((assignment) => {
        const submission = student.submissions.find(
          (sub) => sub.assignment.judul === assignment.judul
        );
        assignmentScores[assignment.id] = submission?.nilai || "-";
      });

      const finalScore = student.FinalScore[0];

      return {
        nama: student.namaLengkap,
        nisn: student.nisn,
        assignmentScores,
        finalScore: finalScore?.nilaiAkhir || "-",
      };
    });

    const reportData = {
      class: classSubjectTutor.class,
      subject: classSubjectTutor.subject,
      tutor: classSubjectTutor.tutor,
      assignments,
      students: studentsData,
    };

    // Generate report based on format
    if (format === "pdf") {
      return generatePDFSubjectScores(reportData);
    } else {
      return generateExcelSubjectScores(reportData);
    }
  } catch (error) {
    console.error("Error generating subject scores report:", error);
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

function generatePDFSubjectScores(data) {
  const doc = createPDF("landscape");

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  addText(doc, "LAPORAN NILAI MATA PELAJARAN", 148, 15, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  addText(doc, `Mata Pelajaran: ${data.subject.namaMapel}`, 14, 25);
  addText(doc, `Kelas: ${data.class.namaKelas}`, 14, 31);
  addText(doc, `Program: ${data.class.program?.namaPaket || "-"}`, 14, 37);
  addText(
    doc,
    `Tahun Ajaran: ${data.class.academicYear?.tahunMulai}/${data.class.academicYear?.tahunSelesai} - ${data.class.academicYear?.semester}`,
    14,
    43
  );
  addText(doc, `Tutor: ${data.tutor.namaLengkap}`, 14, 49);

  // Prepare table headers
  const headers = ["No", "Nama Siswa", "NISN"];

  // Add assignment headers (limit to avoid overflow)
  const maxAssignments = Math.min(data.assignments.length, 5);
  data.assignments.slice(0, maxAssignments).forEach((assignment) => {
    const shortTitle =
      assignment.judul.length > 15
        ? assignment.judul.substring(0, 12) + "..."
        : assignment.judul;
    headers.push(shortTitle);
  });

  headers.push("Nilai Akhir");

  // Prepare table data
  const tableData = data.students.map((student, index) => {
    const row = [index + 1, student.nama, student.nisn];

    // Add assignment scores
    data.assignments.slice(0, maxAssignments).forEach((assignment) => {
      row.push(student.assignmentScores[assignment.id]);
    });

    row.push(student.finalScore);
    return row;
  });

  createAutoTable(doc, {
    startY: 55,
    head: [headers],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185],
      halign: "center",
      fontSize: 7,
    },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { halign: "center", cellWidth: 25 },
    },
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

  if (data.assignments.length > maxAssignments) {
    addText(
      doc,
      `* Hanya menampilkan ${maxAssignments} dari ${data.assignments.length} tugas`,
      14,
      finalY + 6
    );
  }

  const pdfBuffer = pdfToBuffer(doc);
  const filename = `laporan-nilai-${data.subject.namaMapel.replace(
    /\s+/g,
    "-"
  )}-${data.class.namaKelas}.pdf`;

  return createPDFResponse(pdfBuffer, filename);
}

function generateExcelSubjectScores(data) {
  const worksheetData = [
    ["LAPORAN NILAI MATA PELAJARAN"],
    [],
    [`Mata Pelajaran: ${data.subject.namaMapel}`],
    [`Kelas: ${data.class.namaKelas}`],
    [`Program: ${data.class.program?.namaPaket || "-"}`],
    [
      `Tahun Ajaran: ${data.class.academicYear?.tahunMulai}/${data.class.academicYear?.tahunSelesai} - ${data.class.academicYear?.semester}`,
    ],
    [`Tutor: ${data.tutor.namaLengkap}`],
    [],
  ];

  // Headers
  const headers = ["No", "Nama Siswa", "NISN"];
  data.assignments.forEach((assignment) => {
    headers.push(`${assignment.judul} (${assignment.jenis})`);
  });
  headers.push("Nilai Akhir");
  worksheetData.push(headers);

  // Data
  data.students.forEach((student, index) => {
    const row = [index + 1, student.nama, student.nisn];

    data.assignments.forEach((assignment) => {
      row.push(student.assignmentScores[assignment.id]);
    });

    row.push(student.finalScore);
    worksheetData.push(row);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Nilai");

  // Set column widths
  const colWidths = [{ wch: 5 }, { wch: 30 }, { wch: 15 }];
  data.assignments.forEach(() => colWidths.push({ wch: 12 }));
  colWidths.push({ wch: 12 });
  worksheet["!cols"] = colWidths;

  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=laporan-nilai-${data.subject.namaMapel.replace(
        /\s+/g,
        "-"
      )}-${data.class.namaKelas}.xlsx`,
    },
  });
}
