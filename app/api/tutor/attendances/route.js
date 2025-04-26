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

    // 🔥 Cari tutor.id berdasarkan user.id
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor profile not found" },
        { status: 404 }
      );
    }

    const attendances = await prisma.attendanceSession.findMany({
      where: {
        tutorId: tutor.id, // ✅ pakai tutor.id
      },
      include: {
        class: { select: { namaKelas: true } },
        academicYear: { select: { tahunMulai: true, tahunSelesai: true } },
        attendances: {
          include: {
            student: {
              select: { namaLengkap: true },
            },
          },
        },
      },
      orderBy: { tanggal: "desc" },
    });

    return NextResponse.json({ success: true, data: attendances });
  } catch (error) {
    console.error("Gagal memuat daftar presensi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar presensi" },
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

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        tutorId: tutor.id, // ❗ Bukan user.id, tapi tutor.id
        classId,
        academicYearId,
        tanggal: new Date(tanggal),
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
