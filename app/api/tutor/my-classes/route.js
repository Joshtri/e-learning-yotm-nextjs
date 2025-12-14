import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Cari tutorId berdasarkan userId
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Data tutor tidak ditemukan" },
        { status: 404 }
      );
    }



    const { searchParams } = new URL(request.url);
    let academicYearId = searchParams.get("academicYearId");

    // Fallback ke tahun ajaran aktif jika tidak diberikan
    if (!academicYearId) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
        select: { id: true },
      });

      academicYearId = activeYear?.id;

      if (!academicYearId) {
        return NextResponse.json(
          { success: false, message: "Tidak ada tahun ajaran aktif" },
          { status: 400 }
        );
      }
    }

    // ✅ Get unique classes where tutor is homeroom teacher OR teaches any subject
    // This gives us all classes a tutor manages/teaches
    const classesAsHomeroom = await prisma.class.findMany({
      where: {
        academicYearId: academicYearId,
        homeroomTeacherId: tutor.id,
      },
      select: {
        id: true,
        namaKelas: true,
        academicYear: {
          select: {
            id: true,
            tahunMulai: true,
            tahunSelesai: true,
            isActive: true,
            semester: true,
          },
        },
        program: {
          select: {
            id: true,
            namaPaket: true,
          },
        },
        homeroomTeacher: {
          select: {
            id: true,
            namaLengkap: true,
            userId: true,
          },
        },
      },
    });

    // ✅ Get classes where tutor teaches subjects (deduplicated)
    const classesAsTeacher = await prisma.classSubjectTutor.findMany({
      where: {
        tutorId: tutor.id,
        class: {
          academicYearId: academicYearId,
        },
      },
      include: {
        subject: { select: { id: true, namaMapel: true } }, // 🔥 Include ID & Name
        class: {
          select: {
            id: true,
            namaKelas: true,
            academicYear: {
              select: {
                id: true,
                tahunMulai: true,
                tahunSelesai: true,
                isActive: true,
                semester: true,
              },
            },
            program: {
              select: {
                id: true,
                namaPaket: true,
              },
            },
            homeroomTeacher: {
              select: {
                id: true,
                namaLengkap: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    // ✅ Deduplicate and combine both lists
    const classMap = new Map();

    // Add homeroom classes
    classesAsHomeroom.forEach(cls => {
      classMap.set(cls.id, {
        id: cls.id,
        namaKelas: cls.namaKelas,
        academicYear: cls.academicYear,
        program: cls.program,
        homeroomTeacher: cls.homeroomTeacher,
        taughtSubjects: [], // Init array
        isHomeroom: true, // Flag for UI
      });
    });

    // Add teacher classes (if not already added as homeroom)
    classesAsTeacher.forEach(item => {
      if (!classMap.has(item.class.id)) {
        classMap.set(item.class.id, {
          id: item.class.id,
          namaKelas: item.class.namaKelas,
          academicYear: item.class.academicYear,
          program: item.class.program,
          homeroomTeacher: item.class.homeroomTeacher,
          taughtSubjects: [],
          isHomeroom: false,
        });
      }

      // Add subject to the list
      const existing = classMap.get(item.class.id);
      if (item.subject) {
        existing.taughtSubjects.push({
          id: item.subject.id,
          name: item.subject.namaMapel,
        });
      }
    });

    // ✅ Convert to array and sort by class name
    const data = Array.from(classMap.values()).sort((a, b) =>
      a.namaKelas.localeCompare(b.namaKelas)
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Gagal mengambil data kelas yang diajar tutor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil data kelas",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
