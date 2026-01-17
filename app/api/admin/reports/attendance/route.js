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
    const whereClause = {};

    if (classId && classId !== "all") {
      whereClause.id = classId;
    } else {
      whereClause.academicYearId = academicYearId;
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
      // Get all sessions for this class with subject info
      const sessions = await prisma.attendanceSession.findMany({
        where: {
          classId: kelas.id,
          academicYearId: kelas.academicYearId,
        },
        include: {
          subject: true,
          attendances: true,
        },
        orderBy: {
          tanggal: "asc",
        },
      });

      // Group by subject
      const subjectGroups = {};

      sessions.forEach(session => {
        const subId = session.subjectId;
        if (!subjectGroups[subId]) {
          subjectGroups[subId] = {
            subjectName: session.subject.namaMapel,
            sessions: []
          };
        }
        subjectGroups[subId].sessions.push(session);
      });

      // Process each subject
      const subjectsData = [];

      for (const [subId, group] of Object.entries(subjectGroups)) {
        // Initialize student stats for this subject
        const studentStats = {};
        kelas.students.forEach((student) => {
          studentStats[student.id] = {
            nama: student.namaLengkap,
            nisn: student.nisn,
            hadir: 0,
            sakit: 0,
            izin: 0,
            alpha: 0,
          };
        });

        // Calculate stats
        group.sessions.forEach(session => {
          session.attendances.forEach(att => {
            if (studentStats[att.studentId]) {
              if (att.status === "PRESENT") studentStats[att.studentId].hadir++;
              else if (att.status === "SICK") studentStats[att.studentId].sakit++;
              else if (att.status === "EXCUSED") studentStats[att.studentId].izin++;
              else if (att.status === "ABSENT") studentStats[att.studentId].alpha++;
            }
          });
        });

        subjectsData.push({
          subjectName: group.subjectName,
          studentStats
        });
      }

      // If no subjects/sessions found, likely we still want to show the class list? 
      // User requested "absen di pelajaran itu". If no sessions, maybe skip or show empty.
      // Let's keep it if there are subjects. If empty, maybe just header.

      attendanceData.push({
        kelas,
        subjectsData,
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
  // Get filename parts
  const className = attendanceData.length === 1 ? attendanceData[0].kelas.namaKelas.replace(/[^a-zA-Z0-9]/g, "_") : "Semua_Kelas";
  const yearStr = `${academicYear?.tahunMulai}-${academicYear?.tahunSelesai}`;
  const semesterStr = academicYear?.semester || "";

  const filename = sanitizeFilename(
    `Laporan_Presensi_${className}_${yearStr}_${semesterStr}.pdf`
  );

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  addText(doc, "LAPORAN REKAPITULASI PRESENSI SISWA", 105, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  addText(
    doc,
    `Tahun Ajaran: ${academicYear?.tahunMulai}/${academicYear?.tahunSelesai} - Semester ${academicYear?.semester}`,
    105,
    22,
    { align: "center" }
  );

  let currentY = 30;

  // Loop through each class
  attendanceData.forEach((data, index) => {
    const { kelas, subjectsData } = data;

    if (index > 0) {
      doc.addPage();
      currentY = 20;
    }

    // Class Info Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    addText(doc, `Kelas: ${kelas.namaKelas}`, 14, currentY);
    currentY += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    addText(doc, `Wali Kelas: ${kelas.homeroomTeacher?.user?.nama || "Belum ditentukan"}`, 14, currentY);
    currentY += 10;

    if (subjectsData.length === 0) {
      addText(doc, "Belum ada data presensi untuk kelas ini.", 14, currentY);
      currentY += 10;
      return;
    }

    // Loop through subjects in this class
    subjectsData.forEach((subjectData, sIdx) => {
      const { subjectName, studentStats } = subjectData;

      // Check space
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 50, 100);
      addText(doc, `Mata Pelajaran: ${subjectName}`, 14, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 5;

      // Table
      const tableData = Object.values(studentStats).map(
        (student, idx) => [
          idx + 1,
          student.nama,
          student.nisn || "-",
          student.hadir,
          student.sakit,
          student.izin,
          student.alpha,
          student.hadir + student.sakit + student.izin + student.alpha, // Total Attendance Entries
          // Optional: Percentage? Let's stick to counts for now as requested
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
        headStyles: { fillColor: [52, 152, 219], halign: "center", textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2, valing: 'middle' },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { cellWidth: 60 },
          2: { halign: "center", cellWidth: 25 },
          3: { halign: "center", cellWidth: 15 },
          4: { halign: "center", cellWidth: 15 },
          5: { halign: "center", cellWidth: 15 },
          6: { halign: "center", cellWidth: 15 },
          7: { halign: "center", cellWidth: 15 },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Optional: header on new pages if split
        }
      });

      currentY = doc.lastAutoTable.finalY + 15;
    });
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 285);
    doc.text(`Halaman ${i} dari ${pageCount}`, 195, 285, { align: "right" });
  }

  const pdfBuffer = pdfToBuffer(doc);
  return createPDFResponse(pdfBuffer, filename);
}

function generateExcelAttendance(attendanceData) {
  const workbook = XLSX.utils.book_new();

  // Get academic year info from first class
  const academicYear = attendanceData[0]?.kelas?.academicYear;
  const yearStr = `${academicYear?.tahunMulai}-${academicYear?.tahunSelesai}`;
  const semesterStr = academicYear?.semester || "";
  const className = attendanceData.length === 1 ? attendanceData[0].kelas.namaKelas.replace(/[^a-zA-Z0-9]/g, "_") : "Semua_Kelas";

  const filename = sanitizeFilename(
    `Laporan_Presensi_${className}_${yearStr}_${semesterStr}.xlsx`
  );

  attendanceData.forEach((data) => {
    const { kelas, subjectsData } = data;

    // If no subjects, maybe skip or empty sheet
    if (subjectsData.length === 0) return;

    subjectsData.forEach(subjectData => {
      const { subjectName, studentStats } = subjectData;

      const worksheetData = [
        ["LAPORAN REKAPITULASI PRESENSI SISWA"],
        [],
        [`Kelas: ${kelas.namaKelas}`],
        [`Mata Pelajaran: ${subjectName}`],
        [`Wali Kelas: ${kelas.homeroomTeacher?.user?.name || "-"}`],
        [
          `Tahun Ajaran: ${academicYear?.tahunMulai}/${academicYear?.tahunSelesai} - Semester ${academicYear?.semester}`,
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

      Object.values(studentStats).forEach((student, index) => {
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

      // Sheet name: Class - Subject (truncated)
      // clean chars
      const cleanClass = kelas.namaKelas.replace(/[:\\\/?*\[\]]/g, "");
      const cleanSub = subjectName.replace(/[:\\\/?*\[\]]/g, "");
      const sheetName = `${cleanClass}-${cleanSub}`.substring(0, 31);

      // Handle duplicate sheet names if needed? XLSX usually throws. 
      // Assuming unique class-subject combo.
      // If sheet name exists, append number? simple try catch or check
      try {
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      } catch (e) {
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 28) + (Math.floor(Math.random() * 99)));
      }
    });
  });

  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
