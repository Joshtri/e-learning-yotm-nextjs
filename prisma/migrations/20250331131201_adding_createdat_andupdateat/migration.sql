-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TUTOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('MATERIAL', 'EXERCISE', 'QUIZ', 'MIDTERM', 'FINAL_EXAM');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'LATE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'MATCHING');

-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('usr_', gen_random_uuid()),
    "nama" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "Status" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('std_', gen_random_uuid()),
    "userId" TEXT NOT NULL,
    "namaLengkap" VARCHAR(100) NOT NULL,
    "nisn" VARCHAR(20) NOT NULL,
    "jenisKelamin" "Gender",
    "tempatLahir" VARCHAR(50),
    "tanggalLahir" TIMESTAMP(3),
    "alamat" TEXT,
    "fotoUrl" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classId" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutor" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('ttr_', gen_random_uuid()),
    "userId" TEXT NOT NULL,
    "namaLengkap" VARCHAR(100) NOT NULL,
    "bio" TEXT,
    "pendidikan" TEXT,
    "pengalaman" TEXT,
    "telepon" VARCHAR(20),
    "fotoUrl" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('acy_', gen_random_uuid()),
    "tahunMulai" INTEGER NOT NULL,
    "tahunSelesai" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('prg_', gen_random_uuid()),
    "namaPaket" VARCHAR(50) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('cls_', gen_random_uuid()),
    "namaKelas" VARCHAR(50) NOT NULL,
    "programId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('sub_', gen_random_uuid()),
    "namaMapel" VARCHAR(100) NOT NULL,
    "kodeMapel" VARCHAR(20),
    "deskripsi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramSubject" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('psj_', gen_random_uuid()),
    "programId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubjectTutor" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('cst_', gen_random_uuid()),
    "tutorId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "ClassSubjectTutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMaterial" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('mat_', gen_random_uuid()),
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
    "id" VARCHAR(40) NOT NULL DEFAULT concat('att_', gen_random_uuid()),
    "materialId" TEXT NOT NULL,
    "namaFile" VARCHAR(150) NOT NULL,
    "fileUrl" VARCHAR(255) NOT NULL,
    "tipeFile" VARCHAR(50) NOT NULL,
    "ukuranFile" INTEGER NOT NULL,

    CONSTRAINT "MaterialAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('asn_', gen_random_uuid()),
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
    "id" VARCHAR(40) NOT NULL DEFAULT concat('qz_', gen_random_uuid()),
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
    "id" VARCHAR(40) NOT NULL DEFAULT concat('qst_', gen_random_uuid()),
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
    "id" VARCHAR(40) NOT NULL DEFAULT concat('opt_', gen_random_uuid()),
    "questionId" TEXT NOT NULL,
    "teks" VARCHAR(500) NOT NULL,
    "adalahBenar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AnswerOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('sbm_', gen_random_uuid()),
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
    "id" VARCHAR(40) NOT NULL DEFAULT concat('ans_', gen_random_uuid()),
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,
    "adalahBenar" BOOLEAN,
    "feedback" VARCHAR(500),
    "nilai" DOUBLE PRECISION,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_nisn_key" ON "Student"("nisn");

-- CreateIndex
CREATE INDEX "Student_nisn_idx" ON "Student"("nisn");

-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_userId_key" ON "Tutor"("userId");

-- CreateIndex
CREATE INDEX "Tutor_telepon_idx" ON "Tutor"("telepon");

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
CREATE UNIQUE INDEX "ProgramSubject_programId_subjectId_key" ON "ProgramSubject"("programId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubjectTutor_tutorId_classId_subjectId_key" ON "ClassSubjectTutor"("tutorId", "classId", "subjectId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSubject" ADD CONSTRAINT "ProgramSubject_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSubject" ADD CONSTRAINT "ProgramSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
