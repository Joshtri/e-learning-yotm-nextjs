import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("DEBUG - User ID:", user.id);

    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
      include: {
        homeroomClasses: {
          include: {
            academicYear: true,
            program: true,
          },
          orderBy: [
            { academicYear: { tahunMulai: "desc" } },
            { academicYear: { semester: "desc" } },
          ],
        }
      }
    });

    console.log("DEBUG - Tutor found:", !!tutor);
    console.log("DEBUG - Homeroom classes count:", tutor?.homeroomClasses?.length || 0);

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // Extract unique academic years from homeroom classes
    const academicYears = [];
    const seen = new Set();

    for (const kelas of tutor.homeroomClasses) {
      const key = kelas.academicYearId;
      if (!seen.has(key)) {
        seen.add(key);
        academicYears.push({
          id: kelas.academicYear.id,
          tahunMulai: kelas.academicYear.tahunMulai,
          tahunSelesai: kelas.academicYear.tahunSelesai,
          semester: kelas.academicYear.semester,
          isActive: kelas.academicYear.isActive,
          namaKelas: kelas.namaKelas,
          programNama: kelas.program?.namaPaket || "",
        });
      }
    }

    console.log("DEBUG - Academic years found:", academicYears.length);
    console.log("DEBUG - Academic years:", JSON.stringify(academicYears, null, 2));

    return NextResponse.json({ success: true, data: academicYears });
  } catch (error) {
    console.error("ERROR in /api/homeroom/academic-years:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
