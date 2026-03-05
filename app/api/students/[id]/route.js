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
            status: student.status, // ⬅️ include status for edit form
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

    // ── Cek duplikat NISN (hanya jika NISN diisi dan bukan milik siswa ini) ──
    if (data.nisn && data.nisn.trim() !== "") {
      const existing = await prisma.student.findFirst({
        where: {
          nisn: data.nisn.trim(),
          id: { not: id }, // exclude diri sendiri
        },
      });
      if (existing) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `NISN "${data.nisn}" sudah digunakan oleh siswa lain.`,
          }),
          { status: 409 }
        );
      }
    }

    // ── Build payload hanya dengan field yang dikirim ──
    const updatePayload = {};

    if (data.namaLengkap !== undefined) updatePayload.namaLengkap = data.namaLengkap;
    if (data.noTelepon !== undefined) updatePayload.noTelepon = data.noTelepon || null;
    if (data.jenisKelamin !== undefined) updatePayload.jenisKelamin = data.jenisKelamin || null;
    if (data.tempatLahir !== undefined) updatePayload.tempatLahir = data.tempatLahir || null;
    if (data.alamat !== undefined) updatePayload.alamat = data.alamat || null;
    if (data.tanggalLahir !== undefined) {
      updatePayload.tanggalLahir = data.tanggalLahir ? new Date(data.tanggalLahir) : null;
    }

    // NISN & NIS: set null jika kosong, set value jika diisi
    if (data.nisn !== undefined) {
      updatePayload.nisn = data.nisn && data.nisn.trim() !== "" ? data.nisn.trim() : null;
    }
    if (data.nis !== undefined) {
      updatePayload.nis = data.nis && data.nis.trim() !== "" ? data.nis.trim() : null;
    }

    // classId: hanya update jika dikirim
    if (data.classId !== undefined) {
      updatePayload.classId = data.classId || null;
    }

    // status: validasi enum StudentStatus
    const validStatuses = ["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED", "DROPPED_OUT", "DECEASED"];
    if (data.status !== undefined) {
      if (!validStatuses.includes(data.status)) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Status tidak valid: "${data.status}". Pilih salah satu dari: ${validStatuses.join(", ")}.`,
          }),
          { status: 400 }
        );
      }
      updatePayload.status = data.status;
    }

    const updated = await prisma.student.update({
      where: { id },
      data: updatePayload,
    });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error("Gagal update siswa:", error);

    // Handle Prisma unique constraint violation (P2002)
    if (error.code === "P2002") {
      const field = error.meta?.target?.join(", ") || "field";
      return new Response(
        JSON.stringify({
          success: false,
          message: `Data duplikat: nilai pada ${field} sudah digunakan oleh siswa lain.`,
          error: error.message,
        }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal update siswa",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}


export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Cek existensi student beserta jumlah data terkait
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            submissions: true,
            Attendance: true,
            SkillScore: true,
            BehaviorScore: true,
            FinalScore: true,
          },
        },
      },
    });

    if (!student) {
      return new Response(
        JSON.stringify({ success: false, message: "Siswa tidak ditemukan" }),
        { status: 404 }
      );
    }

    // Hindari penghapusan jika siswa sudah memiliki data riwayat masuk/ujian/nilai
    const hasRelatedData =
      student._count.submissions > 0 ||
      student._count.Attendance > 0 ||
      student._count.SkillScore > 0 ||
      student._count.BehaviorScore > 0 ||
      student._count.FinalScore > 0;

    if (hasRelatedData) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Gagal menghapus: Siswa memiliki data terkait (Nilai, Absensi, dll).",
        }),
        { status: 400 }
      );
    }

    // Hapus semua child records dulu (karena tidak ada onDelete: Cascade di schema),
    // baru hapus Student dan User-nya dalam satu transaksi.
    await prisma.$transaction(async (tx) => {
      // 1. Hapus Answer (child dari Submission)
      const submissions = await tx.submission.findMany({
        where: { studentId: id },
        select: { id: true },
      });
      if (submissions.length > 0) {
        const submissionIds = submissions.map((s) => s.id);
        await tx.answer.deleteMany({
          where: { submissionId: { in: submissionIds } },
        });
      }

      // 2. Hapus Submission
      await tx.submission.deleteMany({ where: { studentId: id } });

      // 3. Hapus Attendance
      await tx.attendance.deleteMany({ where: { studentId: id } });

      // 4. Hapus SkillScore
      await tx.skillScore.deleteMany({ where: { studentId: id } });

      // 5. Hapus BehaviorScore
      await tx.behaviorScore.deleteMany({ where: { studentId: id } });

      // 6. Hapus FinalScore
      await tx.finalScore.deleteMany({ where: { studentId: id } });

      // 7. Hapus StudentClassHistory
      await tx.studentClassHistory.deleteMany({ where: { studentId: id } });

      // 8. Hapus Student
      await tx.student.delete({ where: { id } });

      // 9. Hapus referensi dari model yang berhubungan dengan User sebelum menghapus User
      if (student.userId) {
        // Hapus Log aktivitas
        await tx.log.deleteMany({ where: { userId: student.userId } });

        // Hapus Notification (sebagai pengirim maupun penerima)
        await tx.notification.deleteMany({
          where: { OR: [{ senderId: student.userId }, { receiverId: student.userId }] }
        });

        // Hapus pesan Chat dan Diskusi
        await tx.chatMessage.deleteMany({ where: { senderId: student.userId } });
        await tx.discussionMessage.deleteMany({ where: { senderId: student.userId } });

        // Terakhir hapus User
        await tx.user.delete({ where: { id: student.userId } });
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: "Siswa berhasil dihapus" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal hapus siswa:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal menghapus siswa",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
