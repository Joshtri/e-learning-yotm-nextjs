import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { user, error, status } = await getAuthUser(request, ["STUDENT"]);

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        nis: true,
        nisn: true,
        namaLengkap: true,
        jenisKelamin: true,
        tempatLahir: true,
        tanggalLahir: true,
        alamat: true,
        noTelepon: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check which fields are incomplete
    const missingFields = [];

    if (!student.nis) missingFields.push("NIS");
    if (!student.nisn) missingFields.push("NISN");
    if (!student.jenisKelamin) missingFields.push("Jenis Kelamin");
    if (!student.tempatLahir) missingFields.push("Tempat Lahir");
    if (!student.tanggalLahir) missingFields.push("Tanggal Lahir");
    if (!student.alamat) missingFields.push("Alamat");
    if (!student.noTelepon) missingFields.push("No. Telepon");

    const isComplete = missingFields.length === 0;

    return NextResponse.json({
      isComplete,
      missingFields,
      student: {
        id: student.id,
        namaLengkap: student.namaLengkap,
        hasNis: !!student.nis,
        hasNisn: !!student.nisn,
      },
    });
  } catch (error) {
    console.error("Error checking student profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
