/*
  Warnings:

  - You are about to drop the column `address` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `birthPlace` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `Student` table. All the data in the column will be lost.
  - You are about to alter the column `nisn` on the `Student` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to drop the column `education` on the `Tutor` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `Tutor` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Tutor` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `Tutor` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userActivated` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - A unique constraint covering the columns `[nisn]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nama` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `peran` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('MATERIAL', 'EXERCISE', 'QUIZ', 'MIDTERM', 'FINAL_EXAM');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'LATE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'MATCHING');

-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "address",
DROP COLUMN "birthDate",
DROP COLUMN "birthPlace",
DROP COLUMN "gender",
DROP COLUMN "photoUrl",
ADD COLUMN     "alamat" TEXT,
ADD COLUMN     "classId" TEXT,
ADD COLUMN     "fotoUrl" VARCHAR(255),
ADD COLUMN     "jenisKelamin" "Gender",
ADD COLUMN     "tanggalLahir" TIMESTAMP(3),
ADD COLUMN     "tempatLahir" VARCHAR(50),
ALTER COLUMN "nisn" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "Tutor" DROP COLUMN "education",
DROP COLUMN "experience",
DROP COLUMN "phone",
DROP COLUMN "photoUrl",
ADD COLUMN     "fotoUrl" VARCHAR(255),
ADD COLUMN     "pendidikan" TEXT,
ADD COLUMN     "pengalaman" TEXT,
ADD COLUMN     "telepon" VARCHAR(20);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
DROP COLUMN "role",
DROP COLUMN "userActivated",
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "nama" VARCHAR(100) NOT NULL,
ADD COLUMN     "peran" "Role" NOT NULL,
ADD COLUMN     "status" "Status" DEFAULT 'ACTIVE',
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "tahunMulai" INTEGER NOT NULL,
    "tahunSelesai" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "namaPaket" VARCHAR(50) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "namaKelas" VARCHAR(50) NOT NULL,
    "programId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "namaMapel" VARCHAR(100) NOT NULL,
    "kodeMapel" VARCHAR(20),
    "deskripsi" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubjectTutor" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "ClassSubjectTutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMaterial" (
    "id" TEXT NOT NULL,
    "judul" VARCHAR(200) NOT NULL,
    "konten" TEXT NOT NULL,
    "fileUrl" VARCHAR(255),
    "classSubjectTutorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialAttachment" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "namaFile" VARCHAR(150) NOT NULL,
    "fileUrl" VARCHAR(255) NOT NULL,
    "tipeFile" VARCHAR(50) NOT NULL,
    "ukuranFile" INTEGER NOT NULL,

    CONSTRAINT "MaterialAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "judul" VARCHAR(200) NOT NULL,
    "deskripsi" TEXT,
    "jenis" "AssignmentType" NOT NULL,
    "classSubjectTutorId" TEXT NOT NULL,
    "tersediaDari" TIMESTAMP(3) NOT NULL,
    "tersediaHingga" TIMESTAMP(3) NOT NULL,
    "batasWaktuMenit" INTEGER,
    "nilaiMaksimal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "judul" VARCHAR(200) NOT NULL,
    "deskripsi" TEXT,
    "classSubjectTutorId" TEXT NOT NULL,
    "waktuMulai" TIMESTAMP(3) NOT NULL,
    "waktuSelesai" TIMESTAMP(3) NOT NULL,
    "durasiMenit" INTEGER NOT NULL,
    "nilaiMaksimal" INTEGER NOT NULL,
    "acakSoal" BOOLEAN NOT NULL DEFAULT false,
    "acakJawaban" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT,
    "quizId" TEXT,
    "teks" TEXT NOT NULL,
    "jenis" "QuestionType" NOT NULL,
    "poin" INTEGER NOT NULL DEFAULT 1,
    "jawabanBenar" TEXT,
    "pembahasan" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "teks" VARCHAR(500) NOT NULL,
    "adalahBenar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AnswerOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "quizId" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "waktuMulai" TIMESTAMP(3),
    "waktuKumpul" TIMESTAMP(3),
    "nilai" DOUBLE PRECISION,
    "waktuDinilai" TIMESTAMP(3),
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,
    "adalahBenar" BOOLEAN,
    "feedback" VARCHAR(500),
    "nilai" DOUBLE PRECISION,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_tahunMulai_tahunSelesai_key" ON "AcademicYear"("tahunMulai", "tahunSelesai");

-- CreateIndex
CREATE UNIQUE INDEX "Program_namaPaket_key" ON "Program"("namaPaket");

-- CreateIndex
CREATE UNIQUE INDEX "Class_namaKelas_programId_academicYearId_key" ON "Class"("namaKelas", "programId", "academicYearId");

-- CreateIndex
CREATE INDEX "Subject_kodeMapel_idx" ON "Subject"("kodeMapel");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_namaMapel_key" ON "Subject"("namaMapel");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubjectTutor_tutorId_classId_subjectId_key" ON "ClassSubjectTutor"("tutorId", "classId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_nisn_key" ON "Student"("nisn");

-- CreateIndex
CREATE INDEX "Student_nisn_idx" ON "Student"("nisn");

-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

-- CreateIndex
CREATE INDEX "Tutor_telepon_idx" ON "Tutor"("telepon");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_peran_idx" ON "User"("peran");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubjectTutor" ADD CONSTRAINT "ClassSubjectTutor_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubjectTutor" ADD CONSTRAINT "ClassSubjectTutor_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubjectTutor" ADD CONSTRAINT "ClassSubjectTutor_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_classSubjectTutorId_fkey" FOREIGN KEY ("classSubjectTutorId") REFERENCES "ClassSubjectTutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAttachment" ADD CONSTRAINT "MaterialAttachment_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LearningMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classSubjectTutorId_fkey" FOREIGN KEY ("classSubjectTutorId") REFERENCES "ClassSubjectTutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_classSubjectTutorId_fkey" FOREIGN KEY ("classSubjectTutorId") REFERENCES "ClassSubjectTutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerOption" ADD CONSTRAINT "AnswerOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
