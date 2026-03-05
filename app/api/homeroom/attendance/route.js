import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId");
    const classId = searchParams.get("classId"); // 🟢 Tambahan untuk sync dengan class selection

    // Optional filters
    const subjectId = searchParams.get("subjectId");
    const status = searchParams.get("status");

    // Get tutor
    const tutor = await prisma.tutor.findUnique({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 },
      );
    }

    // Get Class - prioritize classId if provided, otherwise find by homeroom teacher
    let kelas;

    if (classId) {
      // 🟢 Use specific classId from context
      kelas = await prisma.class.findFirst({
        where: {
          id: classId,
          homeroomTeacherId: tutor.id, // Ensure user is the homeroom teacher of this class
          ...(academicYearId && { academicYearId }),
        },
        include: { academicYear: true },
      });
    } else {
      // Fallback to finding any class where user is homeroom teacher
      const whereCondition = { homeroomTeacherId: tutor.id };
      if (academicYearId) whereCondition.academicYearId = academicYearId;

      kelas = await prisma.class.findFirst({
        where: whereCondition,
        orderBy: [
          { academicYear: { tahunMulai: "desc" } },
          { academicYear: { semester: "desc" } },
        ],
        include: { academicYear: true },
      });
    }

    if (!kelas) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Build session query
    const sessionWhere = {
      classId: kelas.id,
      academicYearId: kelas.academicYearId,
    };

    if (subjectId) sessionWhere.subjectId = subjectId;
    if (status) sessionWhere.status = status;

    const sessions = await prisma.attendanceSession.findMany({
      where: sessionWhere,
      include: {
        subject: { select: { id: true, namaMapel: true, kodeMapel: true } },
        tutor: { select: { namaLengkap: true } },
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: [{ tanggal: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: {
        className: kelas.namaKelas,
        academicYear: kelas.academicYear,
        sessions: sessions,
      },
    });
  } catch (error) {
    console.error("GET /homeroom/attendance error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const academicYearId = searchParams.get("academicYearId");
    const classId = searchParams.get("classId"); // 🟢 Add classId parameter

    if (!subjectId || !academicYearId) {
      return NextResponse.json(
        { success: false, message: "Subject ID and Academic Year ID required" },
        { status: 400 },
      );
    }

    const tutor = await prisma.tutor.findUnique({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 },
      );
    }

    // Find class - prioritize classId if provided
    let kelas;

    if (classId) {
      kelas = await prisma.class.findFirst({
        where: {
          id: classId,
          homeroomTeacherId: tutor.id,
          ...(academicYearId && { academicYearId }),
        },
      });
    } else {
      kelas = await prisma.class.findFirst({
        where: { homeroomTeacherId: tutor.id, academicYearId: academicYearId },
      });
    }

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Class not found" },
        { status: 404 },
      );
    }

    // Optional: Check if any session has actual attendance data to warn?
    // For now, straightforward delete.
    const deleted = await prisma.attendanceSession.deleteMany({
      where: {
        classId: kelas.id,
        academicYearId: academicYearId,
        subjectId: subjectId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${deleted.count} sesi.`,
    });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
