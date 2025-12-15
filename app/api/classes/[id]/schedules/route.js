import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

// GET /api/classes/[id]/schedules
export async function GET(req, { params }) {
    try {
        const user = await getUserFromCookie();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = params; // Class ID

        // Fetch all schedule items belonging to this class
        // Schedule -> ClassSubjectTutor -> Class
        const classSchedules = await prisma.classSubjectTutor.findMany({
            where: { classId: id },
            include: {
                subject: true,
                tutor: true,
                schedules: true,
            },
        });

        // Flatten data for frontend Grid
        const flatSchedules = [];
        classSchedules.forEach((cst) => {
            if (cst.schedules && cst.schedules.length > 0) {
                cst.schedules.forEach((sch) => {
                    flatSchedules.push({
                        id: sch.id,
                        dayOfWeek: sch.dayOfWeek,
                        startTime: sch.startTime,
                        endTime: sch.endTime,
                        subjectName: cst.subject.namaMapel,
                        subjectCode: cst.subject.kodeMapel,
                        tutorName: cst.tutor.namaLengkap,
                        classSubjectTutorId: cst.id,
                    });
                });
            }
        });

        return NextResponse.json({ success: true, data: flatSchedules });
    } catch (error) {
        console.error("Get schedules error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST /api/classes/[id]/schedules
export async function POST(req, { params }) {
    try {
        const user = await getUserFromCookie();
        if (!user) { // TODO: Check for Admin role
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        // Expected body:
        // { classSubjectTutorId, dayOfWeek, startTime, endTime }

        // Note: startTime/endTime from frontend might be strings "HH:mm" or ISO.
        // Prisma DateTime needs Date object.

        const { classSubjectTutorId, dayOfWeek, startTime, endTime } = body;

        if (!classSubjectTutorId || !dayOfWeek || !startTime || !endTime) {
            return NextResponse.json({ success: false, message: "Incomplete data" }, { status: 400 });
        }

        let startDt, endDt;

        // Helper to parse and normalize time to 1970-01-01 UTC
        const parseAndNormalizeTime = (timeInput) => {
            // Check if input is ISO-like (contains T)
            if (timeInput.includes("T")) {
                const d = new Date(timeInput);
                if (isNaN(d.getTime())) throw new Error("Invalid time format");
                // Create new date on 1970-01-01 UTC with the SAME UTC time as the input
                return new Date(Date.UTC(1970, 0, 1, d.getUTCHours(), d.getUTCMinutes(), 0));
            } else {
                // Fallback for HH:mm format (Legacy/Server-Local interpretation)
                // This assumes the input HH:mm is meant to be Server Local Time
                const [h, m] = timeInput.split(":");
                return new Date(1970, 0, 1, parseInt(h), parseInt(m), 0);
            }
        };

        try {
            startDt = parseAndNormalizeTime(startTime);
            endDt = parseAndNormalizeTime(endTime);
        } catch (e) {
            return NextResponse.json({ success: false, message: "Invalid Time Format" }, { status: 400 });
        }

        // 1. Get Tutor ID from classSubjectTutorId
        const cst = await prisma.classSubjectTutor.findUnique({
            where: { id: classSubjectTutorId },
            select: { tutorId: true, classId: true }
        });

        if (!cst) {
            return NextResponse.json({ success: false, message: "Invalid Class Subject Tutor ID" }, { status: 400 });
        }

        // 1.5 Check for Duplicate Subject on the same Day (One session per subject rule)
        const existingSubject = await prisma.schedule.findFirst({
            where: {
                classSubjectTutorId: classSubjectTutorId,
                dayOfWeek: parseInt(dayOfWeek)
            }
        });

        if (existingSubject) {
            return NextResponse.json({ success: false, message: "Mata pelajaran ini sudah dijadwalkan di hari tersebut." }, { status: 400 });
        }

        // 2. Check for overlapping schedules for this tutor on the same day
        const conflict = await prisma.schedule.findFirst({
            where: {
                dayOfWeek: parseInt(dayOfWeek),
                classSubjectTutor: {
                    tutorId: cst.tutorId // Same Tutor
                },
                // Overlap logic: (StartA < EndB) and (EndA > StartB)
                startTime: { lt: endDt },
                endTime: { gt: startDt }
            },
            include: {
                classSubjectTutor: {
                    include: {
                        class: true,
                        subject: true
                    }
                }
            }
        });

        if (conflict) {
            const conflictClass = conflict.classSubjectTutor.class.namaKelas;
            const conflictSubject = conflict.classSubjectTutor.subject.namaMapel;
            // Use UTC methods or formatting to ensure we show the time correctly?
            // Actually conflict.startTime is from DB. If DB is proper, it works.
            // But we need to format it to a readable string. toLocaleTimeString defaults to Server Local.
            // If we use 'id-ID', it attempts to format using that locale on the server.
            // We should ideally return the raw time or format strictly. 
            // Let's stick to existing toLocaleTimeString but be aware it uses Server Timezone.
            const conflictStart = conflict.startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const conflictEnd = conflict.endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            return NextResponse.json({
                success: false,
                message: `Bentrok dengan jadwal TUGAS ANDA yang lain: ${conflictClass} - ${conflictSubject} (${conflictStart} - ${conflictEnd})`
            }, { status: 400 });
        }

        // 3. Check for CLASS Overlap (Two subjects in same class at same time)
        const classConflict = await prisma.schedule.findFirst({
            where: {
                dayOfWeek: parseInt(dayOfWeek),
                classSubjectTutor: {
                    classId: cst.classId // Same Class
                },
                startTime: { lt: endDt },
                endTime: { gt: startDt }
            },
            include: {
                classSubjectTutor: {
                    include: { subject: true, tutor: true }
                }
            }
        });

        if (classConflict) {
            const conflictSubject = classConflict.classSubjectTutor.subject.namaMapel;
            const conflictTutor = classConflict.classSubjectTutor.tutor.namaLengkap;
            const conflictStart = classConflict.startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const conflictEnd = classConflict.endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            return NextResponse.json({
                success: false,
                message: `Jadwal bentrok dengan mata pelajaran lain di kelas ini: ${conflictSubject} (${conflictTutor}) pada pukul ${conflictStart} - ${conflictEnd}`
            }, { status: 400 });
        }

        const newSchedule = await prisma.schedule.create({
            data: {
                classSubjectTutorId,
                dayOfWeek: parseInt(dayOfWeek),
                startTime: startDt,
                endTime: endDt,
            },
        });

        return NextResponse.json({ success: true, data: newSchedule });

    } catch (error) {
        console.error("Create schedule error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
