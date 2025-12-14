import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(request) {
    try {
        const user = await getUserFromCookie();
        if (!user || user.role !== "TUTOR") {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const classId = searchParams.get("classId");
        const subjectId = searchParams.get("subjectId");

        if (!classId || !subjectId) {
            return NextResponse.json(
                { success: false, message: "Missing classId or subjectId" },
                { status: 400 }
            );
        }

        const tutor = await prisma.tutor.findUnique({
            where: { userId: user.id },
        });

        if (!tutor) {
            return NextResponse.json(
                { success: false, message: "Tutor not found" },
                { status: 404 }
            );
        }

        // 1. Get Class & Academic Year Info
        const kelas = await prisma.class.findUnique({
            where: { id: classId },
            include: {
                academicYear: true,
                program: true,
            },
        });

        if (!kelas) {
            return NextResponse.json(
                { success: false, message: "Class not found" },
                { status: 404 }
            );
        }

        // Permission Check
        const isHomeroom = kelas.homeroomTeacherId === tutor.id;

        // Debug logging
        // console.log("Debug Permission:", { isHomeroom, classId, subjectId, tutorId: tutor.id });

        let isSubjectTutor = false;

        // Check ClassSubjectTutor manually
        const assignments = await prisma.classSubjectTutor.findMany({
            where: {
                classId: classId,
                subjectId: subjectId,
                tutorId: tutor.id
            }
        });

        if (assignments.length > 0) {
            isSubjectTutor = true;
        }

        if (!isHomeroom && !isSubjectTutor) {
            return NextResponse.json(
                { success: false, message: "Anda tidak memiliki akses ke laporan ini" },
                { status: 403 }
            );
        }

        // 2. Get Subject Info & Actual Teacher Name
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
        });

        // Find the teacher who teaches this subject in this class
        const subjectAssignment = await prisma.classSubjectTutor.findFirst({
            where: { classId, subjectId },
            include: {
                tutor: {
                    include: { user: true }
                }
            }
        });

        const subjectTeacherName = subjectAssignment?.tutor?.user?.nama || "-";

        // 3. Get Sessions (SELESAI only)
        const sessions = await prisma.attendanceSession.findMany({
            where: {
                classId,
                subjectId,
                status: "SELESAI",
            },
            orderBy: { tanggal: "asc" },
            include: {
                attendances: true,
            },
        });

        // 4. Get Students in Class
        const students = await prisma.student.findMany({
            where: {
                classId: classId,
                status: "ACTIVE",
            },
            orderBy: { namaLengkap: "asc" },
            select: {
                id: true,
                nisn: true,
                namaLengkap: true,
            },
        });

        // 5. Structure Data for Report
        // Map: [Student] -> { [SessionId]: Status }
        const studentAttendanceMap = {};

        students.forEach((student) => {
            studentAttendanceMap[student.id] = {
                info: student,
                attendance: {},
            };
        });

        sessions.forEach((session) => {
            session.attendances.forEach((att) => {
                if (studentAttendanceMap[att.studentId]) {
                    studentAttendanceMap[att.studentId].attendance[session.id] = att.status; // HADIR, SAKIT, etc.
                }
            });
        });

        const reportData = {
            className: kelas.namaKelas,
            programName: kelas.program.namaPaket,
            subjectName: subject?.namaMapel || "-",
            academicYear: `${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai}`,
            semester: kelas.academicYear.semester,
            tutorName: subjectTeacherName, // Use actual subject teacher name

            sessions: sessions.map(s => ({
                id: s.id,
                date: s.tanggal,
                meetingNumber: s.meetingNumber
            })),

            students: students.map(s => ({
                id: s.id,
                nisn: s.nisn,
                name: s.namaLengkap,
                statuses: sessions.map(session => {
                    const status = studentAttendanceMap[s.id]?.attendance[session.id];
                    // Normalize status code: HADIR -> H, SAKIT -> S, IZIN -> I, ALPHA -> A
                    return status || "-";
                })
            }))
        };

        return NextResponse.json({ success: true, data: reportData });

    } catch {
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
