import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
  try {
    const { id: assignmentId } = params;
    const body = await req.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions)) {
      return new Response(
        JSON.stringify({ success: false, message: "Pertanyaan tidak valid" }),
        {
          status: 400,
        }
      );
    }

    for (const q of questions) {
      const createdQuestion = await prisma.question.create({
        data: {
          teks: q.teks,
          jenis: q.jenis || "MULTIPLE_CHOICE",
          poin: q.poin || 1,
          jawabanBenar: q.options.find((o) => o.adalahBenar)?.teks || "",
          assignment: { connect: { id: assignmentId } },
        },
      });

      for (const opt of q.options) {
        await prisma.answerOption.create({
          data: {
            questionId: createdQuestion.id,
            teks: opt.teks,
            adalahBenar: opt.adalahBenar || false,
          },
        });
      }
    }

    return Response.json({
      success: true,
      message: "Soal berhasil ditambahkan",
    });
  } catch (error) {
    console.error("Gagal simpan soal:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal simpan soal" }),
      {
        status: 500,
      }
    );
  }
}
