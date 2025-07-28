import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({ success: false, message: "ID tidak ditemukan" }),
      { status: 400 }
    );
  }

  try {
    const programSubject = await prisma.programSubject.findUnique({
      where: { id },
      include: {
        program: true,
        subject: true,
      },
    });

    if (!programSubject) {
      return new Response(
        JSON.stringify({ success: false, message: "Data tidak ditemukan" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: programSubject }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Gagal mengambil program-subject:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Terjadi kesalahan pada server",
      }),
      { status: 500 }
    );
  }
}

// PUT /api/program-subjects/[id]
export async function PUT(req, { params }) {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({ success: false, message: "ID tidak ditemukan" }),
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { programId, subjectId } = body;

    if (!programId || !subjectId) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi" }),
        { status: 400 }
      );
    }

    const updated = await prisma.programSubject.update({
      where: { id },
      data: {
        programId,
        subjectId,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data berhasil diperbarui",
        data: updated,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Gagal update program-subject:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal update data" }),
      { status: 500 }
    );
  }
}

// DELETE /api/program-subjects/[id]
export async function DELETE(req, { params }) {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({ success: false, message: "ID tidak ditemukan" }),
      { status: 400 }
    );
  }

  try {
    await prisma.programSubject.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data berhasil dihapus",
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Gagal menghapus program-subject:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal menghapus data" }),
      { status: 500 }
    );
  }
}
