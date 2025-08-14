import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        class: {
          include: {
            program: {
              select: {
                id: true,
                namaPaket: true,
              },
            },
            academicYear: {
              select: {
                tahunMulai: true,
                tahunSelesai: true,
                isActive: true,
              },
            },
            classSubjectTutors: {
              include: {
                subject: {
                  select: {
                    id: true,
                    namaMapel: true,
                    deskripsi: true,
                  },
                },
                tutor: {
                  include: {
                    user: {
                      select: {
                        nama: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return new Response(
        JSON.stringify({ success: false, message: "Student not found" }),
        { status: 404 }
      );
    }

    const classData = student.class
      ? {
          id: student.class.id,
          namaKelas: student.class.namaKelas,
          program: student.class.program,
          academicYear: student.class.academicYear,
          subjects: student.class.classSubjectTutors.map((cst) => ({
            id: cst.subject.id,
            namaMapel: cst.subject.namaMapel,
            deskripsi: cst.subject.deskripsi,
            tutor: {
              id: cst.tutor.id,
              nama: cst.tutor.user.nama,
            },
          })),
        }
      : null;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          student: {
            id: student.id,
            namaLengkap: student.namaLengkap,
            noTelepon: student.noTelepon,
            nisn: student.nisn,
            nis: student.nis,
            jenisKelamin: student.jenisKelamin,
            tempatLahir: student.tempatLahir,
            tanggalLahir: student.tanggalLahir,
            alamat: student.alamat,
            fotoUrl: student.fotoUrl,
            user: student.user,  
            classId: student.classId, // ⬅️ ini penting!

          },
          class: classData,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching student detail:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch student detail",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}



// app/api/students/[id]/route.ts

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const data = await req.json();

    // Validasi da3n prepare payload
    const updatePayload = {
      namaLengkap: data.namaLengkap,
      nisn: data.nisn,
      noTelepon: data.noTelepon,
      nis: data.nis,
      jenisKelamin: data.jenisKelamin,
      tempatLahir: data.tempatLahir,
      tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
      alamat: data.alamat,
    };

    // Tambahkan classId jika ada dan tidak kosong
    if (data.classId) {
      updatePayload.classId = data.classId;
    }

    const updated = await prisma.student.update({
      where: { id },
      data: updatePayload,
    });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error("Gagal update siswa:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal update siswa", error: error.message }),
      { status: 500 }
    );
  }
}
