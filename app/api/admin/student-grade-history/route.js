import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { namaLengkap: { contains: search, mode: "insensitive" } },
          { nisn: { contains: search, mode: "insensitive" } },
          { nis: { contains: search, mode: "insensitive" } },
          {
            user: {
              OR: [
                { nama: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        select: {
          id: true,
          namaLengkap: true,
          nisn: true,
          nis: true,
          status: true,
          user: {
            select: { email: true },
          },
          class: {
            select: {
              namaKelas: true,
              program: {
                select: { namaPaket: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { namaLengkap: "asc" },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[ERROR GET STUDENT GRADE HISTORY LIST]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
