import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor profile not found" },
        { status: 404 }
      );
    }

    // 🔥 Ambil semua kelas yang dia ajar (dari ClassSubjectTutor)
    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: {
        tutorId: tutor.id,
      },
      select: {
        classId: true,
      },
    });

    const classIds = classSubjectTutors.map((cst) => cst.classId);

    if (classIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 🔥 Setup tanggal hari ini - gunakan offset UTC+8 (WITA)
    const now = new Date();
    // Shift ke UTC+8
    const localNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    // Ambil YYYY-MM-DD dari local time
    const todayStr = localNow.toISOString().split("T")[0];

    // Buat Range Start/End dalam UTC
    // Start: 00:00:00 WITA = Previous Day 16:00:00 UTC
    // Tapi karena tanggal di DB tersimpan sebagai absolute timestamp (biasanya 00:00 UTC untuk date-only), 
    // atau jika ada jamnya kita perlu range seharian.
    // Asumsi: 'tanggal' di DB menyimpan datetime lengkap atau setidaknya start of day dari inputan user.
    // Kita filter based on range local day.

    // Range 00:00 WITA s/d 23:59 WITA
    const startOfDayWITA = new Date(`${todayStr}T00:00:00+08:00`);
    const endOfDayWITA = new Date(`${todayStr}T23:59:59.999+08:00`);

    // 🔥 Cari attendance session untuk hari ini dan kelas yang dia ajar
    const attendances = await prisma.attendanceSession.findMany({
      where: {
        classId: { in: classIds },
        tanggal: {
          gte: startOfDayWITA,
          lte: endOfDayWITA,
        },
      },
      include: {
        class: { select: { id: true, namaKelas: true } },
        academicYear: { select: { tahunMulai: true, tahunSelesai: true } },
        // ✅ Removed subject - subjectId tidak ada di AttendanceSession anymore
        attendances: {
          include: {
            student: { select: { namaLengkap: true } },
          },
        },
      },
      orderBy: { tanggal: "desc" },
    });

    return NextResponse.json({ success: true, data: attendances });
  } catch (error) {
    console.error("Gagal memuat daftar presensi hari ini:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar presensi hari ini" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔥 Tambahkan pengecekan tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { classId, academicYearId, tanggal, keterangan } = body;

    // ✅ Removed subjectId validation - AttendanceSession is now homeroom only

    // Konversi tanggal dengan memastikan waktu tetap di awal hari untuk menghindari perbedaan zona waktu
    let tanggalForDB = new Date(tanggal);
    if (typeof tanggal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      // Jika input tanggal dalam format YYYY-MM-DD, buat sebagai UTC
      tanggalForDB = new Date(`${tanggal}T00:00:00.000Z`);
    }

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        tutorId: tutor.id, // ❗ Bukan user.id, tapi tutor.id
        classId,
        academicYearId,
        // ✅ Removed subjectId - AttendanceSession is now homeroom only (no subject)
        tanggal: tanggalForDB,
        keterangan,
      },
    });

    return NextResponse.json({ success: true, data: attendanceSession });
  } catch (error) {
    console.error("Gagal buat presensi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal buat presensi", error: error.message },
      { status: 500 }
    );
  }
}
