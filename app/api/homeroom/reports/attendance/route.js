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
        { success: false, message: "Academic Year ID is required" },
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

    // Get homeroom class for the specified academic year
    const kelas = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        academicYearId: academicYearId
      },
      include: {
        academicYear: true,
        program: true,
        students: {
          where: { status: "ACTIVE" },
          orderBy: { namaLengkap: "asc" },
        },
      },
    });

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Class not found for this academic year" },
        { status: 404 }
      );
    }

    // Get all attendance sessions for this class & academic year
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        classId: kelas.id,
        academicYearId: academicYearId,
      },
      include: {
        subject: true,
        attendances: {
          include: {
            student: true,
          },
        },
      },
      orderBy: {
        subject: { namaMapel: "asc" },
      },
    });

    // Organize data by Subject -> Student
    // Structure: { "Matematika": { "studentId": { nama, ...stats } } }
    const subjectAttendance = {};

    sessions.forEach((session) => {
      const subjectName = session.subject?.namaMapel || "Tanpa Mapel";

      if (!subjectAttendance[subjectName]) {
        subjectAttendance[subjectName] = {};
        // Initialize all students for this subject to ensure everyone is listed
        kelas.students.forEach((student) => {
          subjectAttendance[subjectName][student.id] = {
            nama: student.namaLengkap,
            nisn: student.nisn,
            hadir: 0,
            sakit: 0,
            izin: 0,
            alpha: 0,
          };
        });
      }

      session.attendances.forEach((att) => {
        const stats = subjectAttendance[subjectName][att.studentId];
        if (stats) {
          if (att.status === "PRESENT") stats.hadir++;
          else if (att.status === "SICK") stats.sakit++;
          else if (att.status === "EXCUSED") stats.izin++;
          else if (att.status === "ABSENT") stats.alpha++;
        }
      });
    });

    // Generate report based on format
    if (format === "pdf") {
      return generatePDFAttendance(kelas, subjectAttendance);
    } else {
      return generateExcelAttendance(kelas, subjectAttendance);
    }
  } catch (error) {
    console.error("Error generating attendance report:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

function generatePDFAttendance(kelas, subjectAttendance) {
  const doc = createPDF();

  // Header Title (First Page)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  addText(doc, "LAPORAN PRESENSI PER MATA PELAJARAN", 105, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  addText(doc, `Kelas: ${kelas.namaKelas}`, 14, 25);
  addText(doc, `Tahun Ajaran: ${kelas.academicYear?.tahunMulai}/${kelas.academicYear?.tahunSelesai} (${kelas.academicYear?.semester})`, 14, 30);

  let startY = 40;

  const subjects = Object.keys(subjectAttendance);

  if (subjects.length === 0) {
    addText(doc, "Tidak ada data presensi.", 14, startY);
  }

  subjects.forEach((subjectName, idx) => {
    // Add new page if not enough space for a new section title and some rows
    if (startY > 250 && idx > 0) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    addText(doc, `Mata Pelajaran: ${subjectName}`, 14, startY);
    startY += 5;

    const studentsData = subjectAttendance[subjectName];
    const tableData = Object.values(studentsData).map((student, index) => [
      index + 1,
      student.nama,
      student.nisn,
      student.hadir,
      student.sakit,
      student.izin,
      student.alpha,
      student.hadir + student.sakit + student.izin + student.alpha,
    ]);

    createAutoTable(doc, {
      startY: startY,
      head: [
        ["No", "Nama Siswa", "NISN", "Hadir", "Sakit", "Izin", "Alpha", "Total"],
      ],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], halign: "center" },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { cellWidth: 60 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "center", cellWidth: 15 },
        4: { halign: "center", cellWidth: 15 },
        5: { halign: "center", cellWidth: 15 },
        6: { halign: "center", cellWidth: 15 },
        7: { halign: "center", cellWidth: 15 },
      },
      margin: { top: 20 },
    });

    startY = doc.lastAutoTable.finalY + 15;
  });

  // Footer on the last page
  const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 50;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  addText(
    doc,
    `Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}`,
    14,
    finalY + 5
  );

  const pdfBuffer = pdfToBuffer(doc);
  const filename = `laporan-presensi-mapel-${kelas.academicYear?.tahunMulai}-${kelas.academicYear?.semester}.pdf`;

  return createPDFResponse(pdfBuffer, filename);
}

function generateExcelAttendance(kelas, subjectAttendance) {
  const workbook = XLSX.utils.book_new();
  const subjects = Object.keys(subjectAttendance);

  if (subjects.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([["Tidak ada data presensi"]]);
    XLSX.utils.book_append_sheet(workbook, ws, "Kosong");
  }

  subjects.forEach((subjectName) => {
    // Sanitize sheet name (max 31 chars, no special chars)
    const sheetName = subjectName.replace(/[\\/?*[\]]/g, "").substring(0, 30);

    const worksheetData = [
      [`PRESENSI: ${subjectName.toUpperCase()}`],
      [`Kelas: ${kelas.namaKelas}`],
      [`TA: ${kelas.academicYear?.tahunMulai}/${kelas.academicYear?.tahunSelesai} (${kelas.academicYear?.semester})`],
      [],
      ["No", "Nama Siswa", "NISN", "Hadir", "Sakit", "Izin", "Alpha", "Total"],
    ];

    const studentsData = subjectAttendance[subjectName];
    Object.values(studentsData).forEach((student, index) => {
      worksheetData.push([
        index + 1,
        student.nama,
        student.nisn,
        student.hadir,
        student.sakit,
        student.izin,
        student.alpha,
        student.hadir + student.sakit + student.izin + student.alpha,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 15 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=laporan-presensi-mapel-${kelas.academicYear?.tahunMulai}-${kelas.academicYear?.semester}.xlsx`,
    },
  });
}

