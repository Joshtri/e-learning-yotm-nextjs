/*
  Warnings:

  - Added the required column `namaLengkap` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `namaLengkap` to the `Tutor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "namaLengkap" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "Tutor" ADD COLUMN     "namaLengkap" VARCHAR(100) NOT NULL;
