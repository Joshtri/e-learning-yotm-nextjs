import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const month = searchParams.get("month"); // bulan 1-12

    const whereFilter = {};

    if (classId) {
      whereFilter.classId = classId;
    }

    if (month) {
      const yearNow = new Date().getFullYear();
      const startDate = new Date(yearNow, parseInt(month) - 1, 1);
      const endDate = new Date(yearNow, parseInt(month), 0); // last day of month

      whereFilter.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereFilter,
      include: {
        student: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
        class: {
          select: {
            id: true,
            namaKelas: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const classes = await prisma.class.findMany({
      select: {
        id: true,
        namaKelas: true,
      },
    });

    return NextResponse.json({
      attendances,
      filterOptions: {
        classes,
      },
    });
  } catch (error) {
    console.error("[ERROR_GET_ATTENDANCES]", error);
    return NextResponse.json(
      { message: "Gagal mengambil data presensi." },
      { status: 500 }
    );
  }
}
