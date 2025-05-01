-- CreateTable
CREATE TABLE "FinalScore" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('fns_', gen_random_uuid()),
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "nilaiAkhir" DOUBLE PRECISION NOT NULL,
    "tahunAjaranId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinalScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinalScore_studentId_subjectId_tahunAjaranId_key" ON "FinalScore"("studentId", "subjectId", "tahunAjaranId");

-- AddForeignKey
ALTER TABLE "FinalScore" ADD CONSTRAINT "FinalScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalScore" ADD CONSTRAINT "FinalScore_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalScore" ADD CONSTRAINT "FinalScore_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
