// File: app/api/tutor/submissions/[submissionId]/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

// GET: Get submission detail dengan answers
export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const submissionId = params.id;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          include: {
            user: true,
            class: {
              select: {
                namaKelas: true,
              },
            },

          },
        },
        assignment: {
          include: {
            classSubjectTutor: {
              include: {
                class: true,
                subject: true,
              },
            },
            questions: {
              include: {
                options: true,
              },
              // orderBy: {
              //   createdAt: "asc",
              // },
            },
          },  
        },
        answers: {
          include: {
            question: {
              include: {
                options: true, // Include options for showing correct answer
                assignment: {
                  select: {
                    classSubjectTutor: {
                      select: {
                        subject: {
                          select: {
                            namaMapel: true,
                          },
                        },
                        class: {
                          select: {
                            namaKelas: true,
                          },
                        },
                      },
                    },
                  },
                },
                quiz: {
                  select: {
                    classSubjectTutor: {
                      select: {
                        subject: {
                          select: {
                            namaMapel: true,
                          },
                        },
                        class: {
                          select: {
                            namaKelas: true,
                          },
                        },
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

    if (!submission) {
      return NextResponse.json(
        { success: false, message: "Submission tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        submission,
      },
    });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// PUT: Update nilai dan feedback untuk submission
export async function PUT(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const submissionId = params.id;
    const body = await req.json();
    const { nilai, feedback, answers } = body;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, message: "Submission tidak ditemukan" },
        { status: 404 }
      );
    }

    const now = new Date();

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        nilai: nilai != null ? parseFloat(nilai) : submission.nilai,
        feedback: feedback || submission.feedback,
        waktuDinilai: nilai != null ? now : submission.waktuDinilai,
        status: nilai != null ? "GRADED" : submission.status,
      },
    });

    // Update individual answer grades if provided
    if (answers && Array.isArray(answers)) {
      for (const answerUpdate of answers) {
        if (answerUpdate.answerId) {
          await prisma.answer.update({
            where: { id: answerUpdate.answerId },
            data: {
              nilai: answerUpdate.nilai != null ? parseFloat(answerUpdate.nilai) : undefined,
              feedback: answerUpdate.feedback || undefined,
              adalahBenar: answerUpdate.adalahBenar !== undefined ? answerUpdate.adalahBenar : undefined,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Penilaian berhasil disimpan",
      data: {
        submission: updatedSubmission,
      },
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan penilaian", error: error.message },
      { status: 500 }
    );
  }
}
