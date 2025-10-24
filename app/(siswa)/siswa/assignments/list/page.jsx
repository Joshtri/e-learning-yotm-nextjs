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
import {
  BookOpen,
  Calendar,
  User,
  FileText,
  Star,
  XCircle,
  Clock,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classOptions, setClassOptions] = useState([]);
  const router = useRouter();

  const fetchData = async (academicYearId) => {
    try {
      setLoading(true);
      const params = academicYearId ? { academicYearId } : {};
      const res = await api.get("/student/assignments", { params });
      const data = res.data.data || [];
      setSubjects(data);

      if (res.data.filterOptions) {
        const years = res.data.filterOptions.academicYears.map((y) => ({
          ...y,
          value: y.id,
          label: `${y.tahunMulai}/${y.tahunSelesai} - ${y.semester}`,
        }));
        setAcademicYears(years);
        if (!academicYearId && years.length > 0) {
          const activeYear = years.find((y) => y.isActive);
          setSelectedAcademicYearId(activeYear?.id || years[0].id);
        }
      }

      const classSet = new Map();
      data.forEach((s) => {
        if (s.classId && s.className) {
          classSet.set(s.classId, s.className);
        }
      });
      const classArr = Array.from(classSet.entries()).map(([value, label]) => ({
        value,
        label,
      }));
      setClassOptions(classArr);
    } catch (error) {
      console.error("Gagal memuat data mata pelajaran siswa:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedAcademicYearId);
  }, [selectedAcademicYearId]);

  const getAssignmentWindowState = (tugas) => {
    const now = new Date();
    const currentDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (tugas.TanggalMulai) {
      const startDate = new Date(tugas.TanggalMulai);
      if (currentDate < startDate) return "not_open"; // belum mulai
    }

    if (tugas.TanggalSelesai) {
      const endDate = new Date(tugas.TanggalSelesai);
      if (currentDate > endDate) return "closed"; // sudah selesai
    }

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

      <div className="grid gap-6 mt-6">
        {filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">
              Tidak ada mata pelajaran ditemukan
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Coba ubah filter tahun ajaran atau kelas untuk melihat mata
              pelajaran yang tersedia.
            </p>
          </div>
        ) : (
          filteredSubjects.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{item.namaMapel}</CardTitle>
                  <Badge variant="outline" className="ml-2">
                    {item.className}
                  </Badge>
                </div>
              </CardHeader>
                <Separator/>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-1">Tutor:</span>{" "}
                    {item.tutor}
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-1">Tahun Ajaran:</span>{" "}
                    {item.academicYear}
                  </div>
                  <div className="flex items-center text-sm">
                    <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-1">
                      Jumlah Materi:
                    </span>{" "}
                    {item.jumlahMateri || 0}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Tugas Aktif
                  </h4>
                  {item.tugasAktif.map((tugas) => {
                    const windowState = getAssignmentWindowState(tugas);
                    const canWork =
                      tugas.status === "BELUM_MENGERJAKAN" &&
                      windowState === "open";

                    return (
                      <div
                        key={tugas.id}
                        className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold">{tugas.judul}</p>
                            <Badge
                              variant={
                                tugas.status === "SUDAH_MENGERJAKAN"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {tugas.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {tugas.TanggalMulai &&
                                `${new Date(
                                  tugas.TanggalMulai
                                ).toLocaleDateString("id-ID")}`}
                              {tugas.TanggalMulai &&
                                tugas.TanggalSelesai &&
                                " - "}
                              {tugas.TanggalSelesai &&
                                `${new Date(
                                  tugas.TanggalSelesai
                                ).toLocaleDateString("id-ID")}`}
                            </span>
                            <span className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {tugas.jumlahSoal} Soal
                            </span>
                            {tugas.score !== null && (
                              <span className="flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                Nilai: {tugas.nilai ?? "Belum Dinilai"}
                              </span>
                            )}
                          </div>
                          {tugas.feedback && (
                            <div className="bg-cyan-100 p-2 rounded-md mt-2">
                              <p className="text-xs text-fuchsia-800 italic">
                                <span className="font-semibold">Feedback:</span>{" "}
                                {tugas.feedback}
                              </p>
                            </div>
                          )}

                          {/* Info status waktu */}
                          {windowState === "not_open" && (
                            <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              Belum dibuka
                            </div>
                          )}
                          {windowState === "closed" && (
                            <div className="flex items-center text-xs text-red-600 dark:text-red-400 mt-1">
                              <XCircle className="h-3 w-3 mr-1" />
                              Waktu habis
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
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
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                  canWork
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
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
                                  variant="outline"
                                  size="sm"
                                  className="text-sm font-medium"
                                />
                              ) : (
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/siswa/assignments/${tugas.id}/lihat-soal`
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
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
                              className="px-3 py-1.5 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              Lihat Jawaban Anda
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
