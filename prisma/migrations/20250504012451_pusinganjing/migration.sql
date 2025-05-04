/*
  Warnings:

  - You are about to drop the column `createdAt` on the `HolidayRange` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `HolidayRange` table. All the data in the column will be lost.
  - Added the required column `nama` to the `HolidayRange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HolidayRange" DROP COLUMN "createdAt",
DROP COLUMN "reason",
ADD COLUMN     "academicYearId" TEXT,
ADD COLUMN     "nama" TEXT NOT NULL,
ALTER COLUMN "id" SET DEFAULT concat('hlr_', gen_random_uuid());

-- CreateIndex
CREATE INDEX "HolidayRange_startDate_endDate_idx" ON "HolidayRange"("startDate", "endDate");

-- AddForeignKey
ALTER TABLE "HolidayRange" ADD CONSTRAINT "HolidayRange_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
