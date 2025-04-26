-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'SICK', 'EXCUSED', 'ABSENT');

-- CreateTable
CREATE TABLE "Attendance" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('att_', gen_random_uuid()),
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendanceSessionId" VARCHAR(40),

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('ats_', gen_random_uuid()),
    "tutorId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "keterangan" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillScore" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('skl_', gen_random_uuid()),
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "nilai" DOUBLE PRECISION NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorScore" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('bhs_', gen_random_uuid()),
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "spiritual" DOUBLE PRECISION NOT NULL,
    "sosial" DOUBLE PRECISION NOT NULL,
    "kehadiran" DOUBLE PRECISION NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehaviorScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_classId_idx" ON "Attendance"("classId");

-- CreateIndex
CREATE INDEX "AttendanceSession_academicYearId_idx" ON "AttendanceSession"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillScore_studentId_subjectId_key" ON "SkillScore"("studentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "BehaviorScore_studentId_academicYearId_key" ON "BehaviorScore"("studentId", "academicYearId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "AttendanceSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillScore" ADD CONSTRAINT "SkillScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillScore" ADD CONSTRAINT "SkillScore_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorScore" ADD CONSTRAINT "BehaviorScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorScore" ADD CONSTRAINT "BehaviorScore_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
