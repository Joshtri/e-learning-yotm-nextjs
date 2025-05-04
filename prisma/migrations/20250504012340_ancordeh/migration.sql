-- CreateTable
CREATE TABLE "HolidayRange" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('hrg_', gen_random_uuid()),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HolidayRange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('hld_', gen_random_uuid()),
    "tanggal" TIMESTAMP(3) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_tanggal_key" ON "Holiday"("tanggal");
