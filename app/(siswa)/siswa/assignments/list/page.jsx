// File: app/(student|siswa)/subjects/page.jsx

"use client";

import { AcademicYearFilter } from "@/components/AcademicYearFilter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { PageHeader } from "@/components/ui/page-header";
import SkeletonTable from "@/components/ui/skeleton/SkeletonTable";
import { PDFViewerButton } from "@/components/ui/pdf-viewer";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classOptions, setClassOptions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/student/assignments");
        const data = res.data.data || [];
        setSubjects(data);

        const academicYearSet = new Map();
        const classSet = new Map();

        data.forEach((s) => {
          if (s.academicYearId && s.academicYear) {
            academicYearSet.set(s.academicYearId, s.academicYear);
          }
          if (s.classId && s.className) {
            classSet.set(s.classId, s.className);
          }
        });

        const yearArr = Array.from(academicYearSet.entries()).map(
          ([id, tahun]) => {
            const [tahunMulai, tahunSelesai] = tahun.split("/");
            return { id, tahunMulai, tahunSelesai };
          }
        );
        const classArr = Array.from(classSet.entries()).map(
          ([value, label]) => ({ value, label })
        );

        setAcademicYears(yearArr);
        setClassOptions(classArr);

        if (yearArr.length > 0) setSelectedAcademicYearId(yearArr[0].id);
      } catch (error) {
        console.error("Gagal memuat data mata pelajaran siswa:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getAssignmentWindowState = (tugas) => {
    const now = new Date();
    const start = new Date(tugas.waktuMulai);
    const end = new Date(tugas.waktuSelesai);

    if (now < start) return "not_open"; // belum mulai
    if (now > end) return "closed"; // sudah selesai
    return "open"; // sedang berjalan
  };

  const filteredSubjects = subjects.filter((s) => {
    if (selectedAcademicYearId && s.academicYearId !== selectedAcademicYearId)
      return false;
    if (selectedClassId && s.classId !== selectedClassId) return false;
    return true;
  });

  if (loading)
    return <SkeletonTable numRows={5} numCols={4} showHeader={true} />;

  return (
    <div className="p-6">
      <PageHeader
        title="Tugas Anda"
        description="Daftar tugas yang sudah dikerjakan dan belum dikerjakan"
        actions={
          <div className="flex gap-2">
            <AcademicYearFilter
              academicYears={academicYears}
              selectedId={selectedAcademicYearId}
              onChange={setSelectedAcademicYearId}
            />
            <FilterDropdown
              options={classOptions}
              onSelect={setSelectedClassId}
              label="Kelas"
            />
          </div>
        }
        breadcrumbs={[{ label: "Tugas" }]}
      />

      <div className="grid gap-4 mt-6">
        {filteredSubjects.length === 0 ? (
          <div className="text-muted-foreground">
            Tidak ada mata pelajaran ditemukan
          </div>
        ) : (
          filteredSubjects.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.namaMapel}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  <strong>Tutor:</strong> {item.tutor}
                </p>
                <p>
                  <strong>Kelas:</strong> {item.className}
                </p>
                <p>
                  <strong>Tahun Ajaran:</strong> {item.academicYear}
                </p>
                <p>
                  <strong>Jumlah Materi:</strong> {item.jumlahMateri || 0}
                </p>

                {item.tugasAktif.map((tugas) => {
                  const windowState = getAssignmentWindowState(tugas);
                  const canWork =
                    tugas.status === "BELUM_MENGERJAKAN" &&
                    windowState === "open";

                  return (
                    <div
                      key={tugas.id}
                      className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-4 py-2 border-b last:border-none"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold">{tugas.judul}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tugas.waktuMulai).toLocaleString("id-ID")} -{" "}
                          {new Date(tugas.waktuSelesai).toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs">
                          <strong>Jumlah Soal:</strong> {tugas.jumlahSoal}{" "}
                          {tugas.score !== null && (
                            <>
                              | <strong>Nilai:</strong>{" "}
                              {tugas.nilai ?? "Belum Dinilai"}
                            </>
                          )}
                        </p>
                        {tugas.feedback && (
                          <p className="text-xs text-muted-foreground italic">
                            Feedback: {tugas.feedback}
                          </p>
                        )}

                        {/* Info status waktu */}
                        {windowState === "not_open" && (
                          <span className="text-[11px] text-amber-600">
                            Belum dibuka
                          </span>
                        )}
                        {windowState === "closed" && (
                          <span className="text-[11px] text-red-600">
                            Waktu habis
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            tugas.status === "SUDAH_MENGERJAKAN"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {tugas.status.replace("_", " ")}
                        </Badge>

                        {tugas.status === "BELUM_MENGERJAKAN" ? (
                          <>
                            {/* Kerjakan hanya aktif saat window open */}
                            <button
                              onClick={() =>
                                canWork &&
                                router.push(
                                  `/siswa/assignments/${tugas.id}/start`
                                )
                              }
                              disabled={!canWork}
                              className={`text-sm font-medium underline-offset-2 ${
                                canWork
                                  ? "text-blue-600 hover:underline"
                                  : "text-gray-400 cursor-not-allowed"
                              }`}
                              title={
                                canWork
                                  ? "Mulai kerjakan"
                                  : windowState === "not_open"
                                  ? "Tugas belum dibuka"
                                  : "Waktu pengerjaan telah berakhir"
                              }
                            >
                              Kerjakan
                            </button>

                            {/* Lihat Soal boleh tetap ada (opsional). Kalau mau ikut dibatasi, kamu bisa disable saat not_open/closed */}
                            {tugas.questionsFromPdf ? (
                              <PDFViewerButton
                                pdfData={tugas.questionsFromPdf}
                                title={`Soal - ${tugas.judul}`}
                                downloadFileName={`Soal_${tugas.judul}.pdf`}
                                variant="ghost"
                                size="sm"
                                className="text-sm font-medium text-gray-600 hover:underline p-0 h-auto"
                              />
                            ) : (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/siswa/assignments/${tugas.id}/lihat-soal`
                                  )
                                }
                                className="text-sm font-medium text-gray-600 hover:underline"
                              >
                                Lihat Soal
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              router.push(
                                `/siswa/assignments/${tugas.id}/preview`
                              )
                            }
                            className="text-sm font-medium text-gray-600 hover:underline"
                          >
                            Lihat Jawaban Anda
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
