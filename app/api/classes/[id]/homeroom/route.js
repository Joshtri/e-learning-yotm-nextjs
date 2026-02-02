import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function PATCH(req, { params }) {
  const { id: classId } = params;

  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { homeroomTeacherId } = body;

    if (!homeroomTeacherId) {
      return NextResponse.json(
        { message: "ID Wali Kelas wajib diisi" },
        { status: 400 }
      );
    }

    // Cek apakah tutor yang diberikan valid
    const tutor = await prisma.tutor.findUnique({
      where: { id: homeroomTeacherId },
    });

    if (!tutor) {
      return NextResponse.json(
        { message: "Tutor tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil data kelas yang akan diupdate untuk dapat academicYearId
    const currentClass = await prisma.class.findUnique({
      where: { id: classId },
      select: { academicYearId: true },
    });

    if (!currentClass) {
      return NextResponse.json(
        { message: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah tutor sudah jadi wali kelas di kelas lain pada tahun ajaran yang sama
    const existingHomeroom = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: homeroomTeacherId,
        academicYearId: currentClass.academicYearId,
        id: { not: classId }, // Kecuali kelas ini sendiri
      },
      include: {
        academicYear: true,
      },
    });

    if (existingHomeroom) {
      return NextResponse.json(
        {
          message: `Tutor ini sudah menjadi wali kelas di "${existingHomeroom.namaKelas}" pada tahun ajaran ${existingHomeroom.academicYear?.tahunMulai}/${existingHomeroom.academicYear?.tahunSelesai}`,
        },
        { status: 409 }
      );
    }

    // Update homeroomTeacherId di tabel Class
    await prisma.class.update({
      where: { id: classId },
      data: {
        homeroomTeacherId: homeroomTeacherId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Wali kelas berhasil diperbarui",
    });
  } catch (error) {
    console.error("Gagal update wali kelas:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui wali kelas", error: error.message },
      { status: 500 }
    );
  }
}
