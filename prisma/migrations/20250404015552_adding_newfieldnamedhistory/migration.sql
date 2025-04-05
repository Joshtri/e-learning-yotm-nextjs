-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'TRANSFERRED', 'DROPPED_OUT', 'DECEASED');

-- CreateEnum
CREATE TYPE "TutorStatus" AS ENUM ('ACTIVE', 'RESIGNED', 'RETIRED', 'DECEASED', 'ON_LEAVE');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Tutor" ADD COLUMN     "status" "TutorStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "StudentClassHistory" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('sch_', gen_random_uuid()),
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "naikKelas" BOOLEAN NOT NULL DEFAULT false,
    "nilaiAkhir" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentClassHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudentClassHistory" ADD CONSTRAINT "StudentClassHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentClassHistory" ADD CONSTRAINT "StudentClassHistory_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentClassHistory" ADD CONSTRAINT "StudentClassHistory_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
