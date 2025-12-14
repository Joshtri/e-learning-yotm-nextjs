import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { startOfToday, endOfToday } from "date-fns"; // Not strictly needed for dayOfWeek but good for date ref

export async function GET() {
    try {
        const user = await getUserFromCookie();

        if (!user || user.role !== "TUTOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tutor = await prisma.tutor.findFirst({
            where: { userId: user.id },
        });

        if (!tutor) {
            return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
        }

        // Determine Today's Day of Week
        // JS: 0=Sun, 1=Mon... 6=Sat
        // DB: 1=Mon... 7=Sun (Based on typical logical mapping, checking Roster Array showed 7=Minggu)
        const jsDay = new Date().getDay();
        const dbDay = jsDay === 0 ? 7 : jsDay;

        const schedules = await prisma.schedule.findMany({
            where: {
                dayOfWeek: dbDay,
                classSubjectTutor: {
                    tutorId: tutor.id,
                },
            },
            include: {
                classSubjectTutor: {
                    include: {
                        class: true,
                        subject: true,
                    },
                },
            },
            orderBy: {
                startTime: 'asc',
            },
        });

        const formattedSchedules = schedules.map(sch => ({
            id: sch.id,
            className: sch.classSubjectTutor.class.namaKelas,
            subjectName: sch.classSubjectTutor.subject.namaMapel,
            startTime: sch.startTime, // ISO String (1970 base)
            endTime: sch.endTime,     // ISO String (1970 base)
        }));

        return NextResponse.json({ success: true, data: formattedSchedules });

    } catch (error) {
        console.error("Error fetching today's schedule:", error);
        return NextResponse.json(
            { error: "Failed to fetch schedule" },
            { status: 500 }
        );
    }
}
