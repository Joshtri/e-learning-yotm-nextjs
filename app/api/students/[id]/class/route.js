import prisma from "@/lib/prisma";

export async function PATCH(req, { params }) {
  const { id } = params;
  const { classId } = await req.json();

  if (!classId) {
    return new Response(JSON.stringify({ message: "classId wajib diisi" }), {
      status: 400,
    });
  }

  try {
    await prisma.student.update({
      where: { id },
      data: { classId },
    });

    return Response.json({
      success: true,
      message: "Kelas berhasil ditambahkan ke siswa",
    });
  } catch (err) {
    console.error("Gagal update kelas siswa:", err);
    return new Response(
      JSON.stringify({ message: "Gagal update kelas siswa" }),
      { status: 500 }
    );
  }
}
