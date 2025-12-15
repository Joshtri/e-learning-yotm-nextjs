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
        // The previous generation logic expected DateTime objects in DB.

        const { classSubjectTutorId, dayOfWeek, startTime, endTime } = body;

        if (!classSubjectTutorId || !dayOfWeek || !startTime || !endTime) {
            return NextResponse.json({ success: false, message: "Incomplete data" }, { status: 400 });
        }

        // Convert Time strings to DateTime (arbitrary date, we only care about time)
        // Assuming frontend sends "HH:mm"
        const [startH, startM] = startTime.split(":");
        const [endH, endM] = endTime.split(":");

        // Normalize to 1970-01-01 to match Prisma's @db.Time handling (returns/compares date as 1970-01-01)
        const startDt = new Date(1970, 0, 1, parseInt(startH), parseInt(startM), 0);
        const endDt = new Date(1970, 0, 1, parseInt(endH), parseInt(endM), 0);

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
