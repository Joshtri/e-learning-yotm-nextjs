import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      judul,
      deskripsi,
      jenis,
      classSubjectTutorId,
      waktuMulai,
      waktuSelesai,
      durasiMenit,
      nilaiMaksimal,
      acakSoal,
      acakJawaban,
    } = body;

    if (
      !judul ||
      !jenis ||
      !classSubjectTutorId ||
      !waktuMulai ||
      !waktuSelesai ||
      !durasiMenit ||
      !nilaiMaksimal
    ) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi" }),
        { status: 400 }
      );
    }

    const newExam = await prisma.assignment.create({
      data: {
        judul,
        deskripsi,
        jenis,
        classSubjectTutorId,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(tersediaHingga),
        batasWaktuMenit: durasiMenit,
        nilaiMaksimal: parseInt(nilaiMaksimal),
        classSubjectTutor: { connect: { id: classSubjectTutorId } },
        // Simpan acak soal/jawaban di deskripsi (opsional) atau buat field baru jika dibutuhkan
      },
    });

    return Response.json({
      success: true,
      message: "Ujian berhasil dibuat",
      data: newExam,
    });
  } catch (error) {
    console.error("Gagal menyimpan ujian:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal menyimpan ujian" }),
      { status: 500 }
    );
  }
}
