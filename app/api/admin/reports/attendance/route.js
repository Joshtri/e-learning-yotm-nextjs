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
        students: {
          where: { status: "ACTIVE" },
          orderBy: { namaLengkap: "asc" },
        },
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

    // Get all attendance data for this academic year
    const attendanceData = [];

    for (const kelas of classes) {
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
          if (att.status === "PRESENT")
            studentAttendance[att.studentId].hadir++;
          else if (att.status === "SICK")
            studentAttendance[att.studentId].sakit++;
          else if (att.status === "EXCUSED")
            studentAttendance[att.studentId].izin++;
          else if (att.status === "ABSENT")
            studentAttendance[att.studentId].alpha++;
        }
      });

      attendanceData.push({
        kelas,
        studentAttendance,
      });
    }

    // Generate report based on format
    if (format === "pdf") {
      return generatePDFAttendance(attendanceData);
    } else {
      return generateExcelAttendance(attendanceData);
    }
  } catch (error) {
    console.error("Error generating attendance report:", error);
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

function generatePDFAttendance(attendanceData) {
  const doc = createPDF();

  // Get academic year info from first class
  const academicYear = attendanceData[0]?.kelas?.academicYear;

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  addText(doc, "LAPORAN PRESENSI SISWA", 105, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  addText(
    doc,
    `${academicYear?.tahunMulai}/${academicYear?.tahunSelesai} - Semester ${academicYear?.semester}`,
    105,
    22,
    { align: "center" }
  );

  let currentY = 30;

  // Loop through each class
  attendanceData.forEach((data, index) => {
    const { kelas, studentAttendance } = data;

    // Check if we need a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    // Class header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    addText(doc, `Kelas: ${kelas.namaKelas}`, 14, currentY);
    currentY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    addText(doc, `Program: ${kelas.program?.namaPaket || "-"}`, 14, currentY);
    currentY += 5;
    addText(
      doc,
      `Wali Kelas: ${kelas.homeroomTeacher?.user?.name || "-"}`,
      14,
      currentY
    );
    currentY += 7;

    // Table
    const tableData = Object.values(studentAttendance).map(
      (student, idx) => [
        idx + 1,
        student.nama,
        student.nisn,
        student.hadir,
        student.sakit,
        student.izin,
        student.alpha,
        student.hadir + student.sakit + student.izin + student.alpha,
      ]
    );

    createAutoTable(doc, {
      startY: currentY,
      head: [
        [
          "No",
          "Nama Siswa",
          "NISN",
          "Hadir",
          "Sakit",
          "Izin",
          "Alpha",
          "Total",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], halign: "center" },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { cellWidth: 55 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "center", cellWidth: 15 },
        4: { halign: "center", cellWidth: 15 },
        5: { halign: "center", cellWidth: 15 },
        6: { halign: "center", cellWidth: 15 },
        7: { halign: "center", cellWidth: 15 },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 10;
  });

  // Footer
  doc.setFontSize(9);
  addText(
    doc,
    `Dicetak pada: ${new Date().toLocaleString("id-ID")}`,
    14,
    currentY
  );

  const pdfBuffer = pdfToBuffer(doc);
  const filename = `laporan-presensi-${academicYear?.tahunMulai}-${academicYear?.semester}.pdf`;

  return createPDFResponse(pdfBuffer, filename);
}

function generateExcelAttendance(attendanceData) {
  const workbook = XLSX.utils.book_new();

  // Get academic year info from first class
  const academicYear = attendanceData[0]?.kelas?.academicYear;

  attendanceData.forEach((data) => {
    const { kelas, studentAttendance } = data;

    const worksheetData = [
      ["LAPORAN PRESENSI SISWA"],
      [],
      [`Kelas: ${kelas.namaKelas}`],
      [`Program: ${kelas.program?.namaPaket || "-"}`],
      [`Wali Kelas: ${kelas.homeroomTeacher?.user?.name || "-"}`],
      [
        `Tahun Ajaran: ${kelas.academicYear?.tahunMulai}/${kelas.academicYear?.tahunSelesai} - Semester ${kelas.academicYear?.semester}`,
      ],
      [],
      [
        "No",
        "Nama Siswa",
        "NISN",
        "Hadir",
        "Sakit",
        "Izin",
        "Alpha",
        "Total",
      ],
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

    // Sanitize sheet name (max 31 chars, no special chars)
    const sheetName = kelas.namaKelas.substring(0, 31).replace(/[:\\\/?*\[\]]/g, "");
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=laporan-presensi-${academicYear?.tahunMulai}-${academicYear?.semester}.xlsx`,
    },
  });
}
