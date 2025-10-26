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

    // Get all attendance data for this academic year/semester
    const attendances = await prisma.attendance.findMany({
      where: {
        classId: kelas.id,
      },
      include: {
        student: true,
      },
      orderBy: [
        { date: "asc" },
        { student: { namaLengkap: "asc" } },
      ],
    });

    // Organize data by student
    const studentAttendance = {};
    kelas.students.forEach((student) => {
      studentAttendance[student.id] = {
        nama: student.namaLengkap,
        nisn: student.nisn,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpha: 0,
      };
    });

    attendances.forEach((att) => {
      if (studentAttendance[att.studentId]) {
        if (att.status === "PRESENT") studentAttendance[att.studentId].hadir++;
        else if (att.status === "SICK") studentAttendance[att.studentId].sakit++;
        else if (att.status === "EXCUSED") studentAttendance[att.studentId].izin++;
        else if (att.status === "ABSENT") studentAttendance[att.studentId].alpha++;
      }
    });

    // Generate report based on format
    if (format === "pdf") {
      return generatePDFAttendance(kelas, studentAttendance);
    } else {
      return generateExcelAttendance(kelas, studentAttendance);
    }
  } catch (error) {
    console.error("Error generating attendance report:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

function generatePDFAttendance(kelas, studentAttendance) {
  const doc = createPDF();

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  addText(doc, "LAPORAN PRESENSI SISWA", 105, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  addText(doc, `Kelas: ${kelas.namaKelas}`, 14, 25);
  addText(doc, `Program: ${kelas.program?.namaPaket || "-"}`, 14, 32);
  addText(
    doc,
    `Tahun Ajaran: ${kelas.academicYear?.tahunMulai}/${kelas.academicYear?.tahunSelesai} - Semester ${kelas.academicYear?.semester}`,
    14,
    39
  );

  // Table
  const tableData = Object.values(studentAttendance).map((student, index) => [
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
    startY: 46,
    head: [
      ["No", "Nama Siswa", "NISN", "Hadir", "Sakit", "Izin", "Alpha", "Total"],
    ],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], halign: "center" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 55 },
      2: { halign: "center", cellWidth: 30 },
      3: { halign: "center", cellWidth: 15 },
      4: { halign: "center", cellWidth: 15 },
      5: { halign: "center", cellWidth: 15 },
      6: { halign: "center", cellWidth: 15 },
      7: { halign: "center", cellWidth: 15 },
    },
  });

  // Footer
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  addText(
    doc,
    `Dicetak pada: ${new Date().toLocaleString("id-ID")}`,
    14,
    finalY
  );

  const pdfBuffer = pdfToBuffer(doc);
  const filename = `laporan-presensi-${kelas.academicYear?.tahunMulai}-${kelas.academicYear?.semester}.pdf`;

  return createPDFResponse(pdfBuffer, filename);
}

function generateExcelAttendance(kelas, studentAttendance) {
  const worksheetData = [
    ["LAPORAN PRESENSI SISWA"],
    [],
    [`Kelas: ${kelas.namaKelas}`],
    [`Program: ${kelas.program?.namaPaket || "-"}`],
    [
      `Tahun Ajaran: ${kelas.academicYear?.tahunMulai}/${kelas.academicYear?.tahunSelesai} - Semester ${kelas.academicYear?.semester}`,
    ],
    [],
    ["No", "Nama Siswa", "NISN", "Hadir", "Sakit", "Izin", "Alpha", "Total"],
  ];

  Object.values(studentAttendance).forEach((student, index) => {
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
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Presensi");

  // Set column widths
  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];

  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=laporan-presensi-${kelas.academicYear?.tahunMulai}-${kelas.academicYear?.semester}.xlsx`,
    },
  });
}

