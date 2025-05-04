import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    const { finalScores } = body;

    if (!Array.isArray(finalScores)) {
      return new Response(JSON.stringify({ success: false, message: "finalScores harus array" }), {
        status: 400,
      });
    }

    // Simpan semua dengan upsert agar replace jika sudah ada
    await prisma.$transaction(
        finalScores.map((item) =>
          prisma.finalScore.upsert({
            where: {
              studentId_subjectId_tahunAjaranId: {
                studentId: item.studentId,
                subjectId: item.subjectId,
                tahunAjaranId: item.tahunAjaranId,
              },
            },
            update: {
              nilaiAkhir: item.nilaiAkhir,
            },
            create: {
              studentId: item.studentId,
              subjectId: item.subjectId,
              tahunAjaranId: item.tahunAjaranId,
              nilaiAkhir: item.nilaiAkhir,
            },
          })
        )
      );
      

    return new Response(
      JSON.stringify({
        success: true,
        message: "Nilai akhir berhasil disimpan.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR SAVE FINAL SCORES]", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error", error: error.message }),
      { status: 500 }
    );
  }
}
