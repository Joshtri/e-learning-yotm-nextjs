import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const user = await getUserFromCookie();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const academicYearId = searchParams.get("academicYearId");

        const tutor = await prisma.tutor.findUnique({
            where: { userId: user.id },
        });

        if (!tutor) {
            return NextResponse.json(
                { success: false, message: "Tutor not found" },
                { status: 404 }
            );
        }

        // Find class
        const whereCondition = { homeroomTeacherId: tutor.id };
        if (academicYearId) whereCondition.academicYearId = academicYearId;

        const kelas = await prisma.class.findFirst({
            where: whereCondition,
            include: {
                classSubjectTutors: {
                    include: {
                        subject: true,
                        tutor: true,
                        schedules: true,
                    }
                }
            }
        });

        if (!kelas) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Format data
        const subjects = kelas.classSubjectTutors.map((cst) => ({
            id: cst.id,
            subjectId: cst.subjectId,
            subjectName: cst.subject.namaMapel,
            subjectCode: cst.subject.kodeMapel,
            tutorName: cst.tutor.namaLengkap,
            hasSchedule: cst.schedules.length > 0,
            scheduleDays: cst.schedules.map((s) => s.dayOfWeek),
        }));

        return NextResponse.json({ success: true, data: subjects });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
