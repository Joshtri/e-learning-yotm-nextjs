import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();

    if (!user) {
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
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    // Get all academic years for the filter
    const homeroomClasses = await prisma.class.findMany({
      where: { homeroomTeacherId: tutor.id },
      include: { academicYear: true },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } }, // GENAP first, then GANJIL
      ],
    });

    const academicYears = homeroomClasses.map((c) => ({
      ...c.academicYear,
      value: c.academicYear.id,
      label: `${c.academicYear.tahunMulai}/${c.academicYear.tahunSelesai} - ${c.academicYear.semester}`,
    }));

    const filterOptions = { academicYears };

    let kelas;

    if (academicYearId) {
      // Jika ada parameter academicYearId, cari kelas berdasarkan tahun akademik tersebut
      kelas = await prisma.class.findFirst({
        where: {
          homeroomTeacherId: tutor.id,
          academicYearId: academicYearId,
        },
        include: {
          program: true,
          academicYear: true,
          homeroomTeacher: {
            include: { user: true },
          },
          students: {
            where: { status: 'ACTIVE' },
            include: {
              user: true,
            },
          },
          classSubjectTutors: {
            include: {
              subject: true,
            },
          },
        },
      });
    } else {
      // Jika tidak ada parameter, cari kelas terbaru yang punya siswa aktif
      const allClasses = await prisma.class.findMany({
        where: {
          homeroomTeacherId: tutor.id,
        },
        include: {
          program: true,
          academicYear: true,
          homeroomTeacher: {
            include: { user: true },
          },
          students: {
            where: { status: 'ACTIVE' },
            include: {
              user: true,
            },
          },
          classSubjectTutors: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: [
          { academicYear: { tahunMulai: "desc" } },
          { academicYear: { semester: "desc" } }, // GENAP dulu
        ],
      });

      // Pilih kelas yang punya siswa aktif, jika tidak ada ambil yang terbaru
      kelas = allClasses.find((cls) => cls.students.length > 0) || allClasses[0];
    }

    if (!kelas) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada data kelas untuk tahun ajaran yang dipilih",
          data: null,
          filterOptions,
        },
        { status: 404 }
      );
    }

    const students = kelas.students.map((student) => ({
      id: student.id,
      namaLengkap: student.namaLengkap,
      nisn: student.nisn,
      jenisKelamin: student.jenisKelamin,
      status: student.status,
    }));

    const subjects = kelas.classSubjectTutors.map((cst) => ({
      id: cst.subject.id,
      namaMapel: cst.subject.namaMapel,
      kodeMapel: cst.subject.kodeMapel,
    }));

    const data = {
      namaKelas: kelas.namaKelas,
      program: { namaPaket: kelas.program.namaPaket },
      academicYear: {
        id: kelas.academicYear.id,
        tahunMulai: kelas.academicYear.tahunMulai,
        tahunSelesai: kelas.academicYear.tahunSelesai,
        semester: kelas.academicYear.semester,
        isActive: kelas.academicYear.isActive,
      },
      homeroomTeacher: { namaLengkap: kelas.homeroomTeacher.namaLengkap },
      students,
      subjects,
    };

    return NextResponse.json({ success: true, data, filterOptions });

  } catch (error) {
    console.error(error);
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
