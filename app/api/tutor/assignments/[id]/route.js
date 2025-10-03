import prisma from "@/lib/prisma";

export async function GET(req, context) {
  const { id } = context.params;

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
            tutor: { select: { namaLengkap: true } },
          },
        },
      },
    });

    if (!assignment) {
      return new Response(
        JSON.stringify({ success: false, message: "Tugas tidak ditemukan" }),
        {
          status: 404,
        }
      );
    }

    return new Response(JSON.stringify({ success: true, data: assignment }), {
      status: 200,
    });
  } catch (error) {
    console.error("Gagal GET assignment detail:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat data tugas" }),
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(req, context) {
  const { id } = context.params;

  try {
    const body = await req.json();
    const {
      judul,
      deskripsi,
      classSubjectTutorId,
      tanggalMulai,
      tanggalSelesai,
      jenis,
      nilaiMaksimal,
      questionsFromPdf,
    } = body;

    // Check if assignment exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return new Response(
        JSON.stringify({ success: false, message: "Tugas tidak ditemukan" }),
        { status: 404 }
      );
    }

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: {
        judul,
        deskripsi,
        classSubjectTutorId,
        TanggalMulai: tanggalMulai ? new Date(tanggalMulai) : undefined,
        TanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : undefined,
        jenis,
        nilaiMaksimal,
        questionsFromPdf,
      },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
          },
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tugas berhasil diperbarui",
        data: updatedAssignment,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal PATCH assignment:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memperbarui tugas" }),
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  const { id } = context.params;

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        questions: true,
        submissions: true,
      },
    });

    if (!assignment) {
      return new Response(
        JSON.stringify({ success: false, message: "Tugas tidak ditemukan" }),
        { status: 404 }
      );
    }

    // Optional: blokir penghapusan jika sudah ada submission
    if (assignment.submissions.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tugas tidak dapat dihapus karena sudah ada jawaban siswa.",
        }),
        { status: 400 }
      );
    }

    // Hapus semua soal terkait (jika ada)
    await prisma.question.deleteMany({
      where: { assignmentId: id },
    });

    // Hapus tugas
    await prisma.assignment.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Tugas berhasil dihapus" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal DELETE assignment:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal menghapus tugas" }),
      { status: 500 }
    );
  }
}
