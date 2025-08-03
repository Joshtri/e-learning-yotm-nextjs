import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function PATCH() {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "ADMIN") {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const students = await prisma.student.findMany({
      where: {
        naikKelas: true,
        diprosesNaik: false,
        status: "ACTIVE",
      },
      include: {
        class: {
          include: {
            academicYear: true,
            program: true,
          },
        },
      },
    });

    if (students.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tidak ada siswa untuk diproses.",
        }),
        { status: 400 }
      );
    }

    const nextAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      orderBy: { tahunMulai: "desc" },
    });

    if (!nextAcademicYear) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tahun ajaran baru belum tersedia.",
        }),
        { status: 400 }
      );
    }

    const allTargetClasses = await prisma.class.findMany({
      where: {
        programId: students[0].class.programId,
        academicYearId: nextAcademicYear.id,
      },
    });

    const transactions = students
      .map((student) => {
        const currentClass = student.class;
        function extractKelasNumber(namaKelas) {
          const match = namaKelas.match(/\d+/);
          return match ? parseInt(match[0]) : null;
        }
        
        const currentClassNumber = extractKelasNumber(currentClass.namaKelas);
        
        const targetClass = allTargetClasses.find((c) => {
          const targetClassNumber = extractKelasNumber(c.namaKelas);
          return targetClassNumber === currentClassNumber + 1;
        });

        if (!targetClass) return null;

        return prisma.$transaction([
          prisma.studentClassHistory.create({
            data: {
              studentId: student.id,
              classId: student.classId,
              academicYearId: currentClass.academicYearId,
              naikKelas: true,
            },
          }),

          prisma.student.update({
            where: { id: student.id },
            data: {
              classId: targetClass.id,
              naikKelas: false,
              diprosesNaik: true,
            },
          }),

          prisma.studentClassHistory.create({
            data: {
              studentId: student.id,
              classId: targetClass.id,
              academicYearId: nextAcademicYear.id,
            },
          }),
        ]);
      })
      .filter(Boolean);

    for (const tx of transactions) {
      await tx;
    }

    return new Response(
        JSON.stringify({
          success: true,
          message: `✅ Berhasil memproses ${transactions.length} siswa ke kelas berikutnya untuk tahun ajaran ${nextAcademicYear.tahunMulai}/${nextAcademicYear.tahunSelesai}.`,
          detail: transactions.map((_, i) => {
            const student = students[i];
            const currentClass = student.class.namaKelas;
            const targetClass = allTargetClasses.find(
              (c) => c.namaKelas > currentClass
            )?.namaKelas;
      
            return {
              nama: student.namaLengkap,
              dariKelas: currentClass,
              keKelas: targetClass,
            tahunAjaranBaru: `${nextAcademicYear.tahunMulai}/${nextAcademicYear.tahunSelesai}`,
            };
          }),
        }),
        { status: 200 }
      );
      
  } catch (error) {
    console.error("[ERROR PROCESS PROMOTIONS]", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
