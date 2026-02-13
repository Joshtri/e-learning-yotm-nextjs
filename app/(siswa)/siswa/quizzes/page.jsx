"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SkeletonTable from "@/components/ui/skeleton/SkeletonTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StudentQuizListPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);

  // 🔹 Fetch tahun ajaran
  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years?limit=100");
      setAcademicYears(res.data.data.academicYears);
    } catch (err) {
      toast.error("Gagal memuat tahun ajaran");
    }
  };

  // 🔹 Fetch kuis berdasarkan tahun & semester
  const fetchQuizzes = async (academicYearId, semester) => {
    setIsLoadingQuizzes(true);
    try {
      const params = new URLSearchParams();
      if (academicYearId) params.append("academicYearId", academicYearId);
      if (semester) params.append("semester", semester);

      const res = await api.get(`/student/quizzes?${params.toString()}`);
      setQuizzes(res.data.data || []);
    } catch (err) {
      toast.error("Gagal memuat kuis");
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // 🔹 Set default tahun ajaran & semester aktif
  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYearId) {
      const activeYear = academicYears.find((ay) => ay.isActive);
      const chosenYear = activeYear || academicYears[0];
      if (chosenYear) {
        setSelectedAcademicYearId(chosenYear.id);
        setSelectedSemester(chosenYear.semester);
      }
    }
  }, [academicYears, selectedAcademicYearId]);

  // 🔹 Fetch kuis saat tahun/semester berubah
  useEffect(() => {
    if (selectedAcademicYearId && selectedSemester) {
      fetchQuizzes(selectedAcademicYearId, selectedSemester);
    }
  }, [selectedAcademicYearId, selectedSemester]);

  // 🔹 Ganti tahun ajaran → otomatis ubah semester
  const handleAcademicYearChange = (id) => {
    setSelectedAcademicYearId(id);
    const year = academicYears.find((ay) => ay.id === id);
    if (year) setSelectedSemester(year.semester);
  };

  // 🔹 Helper untuk status kuis berdasarkan waktu
  const getQuizStatus = (quiz) => {
    // Normalisasi ke timestamp untuk perbandingan yang konsisten
    const now = new Date();
    const currentTime = now.getTime();

    const start = new Date(quiz.waktuMulai);
    const startTime = start.getTime();

    const end = new Date(quiz.waktuSelesai);
    const endTime = end.getTime();

    if (currentTime < startTime) return "upcoming"; // belum mulai
    if (currentTime > endTime) return "ended"; // sudah selesai
    return "active"; // sedang berlangsung
  };

  // 🔹 Helper untuk label status
  const renderStatusLabel = (status) => {
    switch (status) {
      case "upcoming":
        return (
          <span className="text-yellow-600 font-medium">🕓 Belum dimulai</span>
        );
      case "ended":
        return (
          <span className="text-red-600 font-medium">🔴 Sudah berakhir</span>
        );
      case "active":
        return (
          <span className="text-green-600 font-medium">
            🟢 Sedang berlangsung
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      <PageHeader
        title="Kuis Aktif"
        description="Berikut daftar kuis yang sedang tersedia untuk kamu"
        breadcrumbs={[
          { label: "Kuis", href: "/siswa/quizzes" },
          { label: "Aktif" },
        ]}
      />

      <div className="flex gap-4 mb-4">
        {/* Tahun Ajaran */}
        <Select
          value={selectedAcademicYearId}
          onValueChange={handleAcademicYearChange}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((ay) => (
              <SelectItem key={ay.id} value={ay.id}>
                {ay.tahunMulai}/{ay.tahunSelesai} ({ay.semester})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Semester otomatis (disabled) */}
        <Select value={selectedSemester} disabled>
          <SelectTrigger className="w-[180px] opacity-70 cursor-not-allowed">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GANJIL">GANJIL</SelectItem>
            <SelectItem value="GENAP">GENAP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Daftar Kuis */}
      {isLoadingQuizzes ? (
        <SkeletonTable numCols={4} numRows={5} showHeader />
      ) : quizzes.length === 0 ? (
        <p className="text-muted-foreground">Tidak ada kuis aktif saat ini.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => {
            const status = getQuizStatus(quiz);

            return (
              <Card key={quiz.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="text-lg font-semibold">{quiz.judul}</div>
                  <div className="text-sm text-muted-foreground">
                    Mapel: {quiz.classSubjectTutor.subject.namaMapel}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tutor: {quiz.classSubjectTutor.tutor.namaLengkap}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tahun Ajaran:{" "}
                    {quiz.classSubjectTutor.class.academicYear.tahunMulai}/
                    {quiz.classSubjectTutor.class.academicYear.tahunSelesai} -{" "}
                    {quiz.classSubjectTutor.class.academicYear.semester}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Waktu: {new Date(quiz.waktuMulai).toLocaleString("id-ID")} -{" "}
                    {new Date(quiz.waktuSelesai).toLocaleString("id-ID")}
                  </div>

                  {/* KKM Info */}
                  <div className="text-sm font-medium text-blue-600">
                    📊 KKM: {quiz.nilaiMaksimal || 75}
                  </div>

                  {/* Status waktu */}
                  <div>{renderStatusLabel(status)}</div>

                  {/* Tombol */}
                  <div className="pt-2">
                    {quiz.sudahDikerjakan ? (
                      <>
                        {quiz.submissions && quiz.submissions.length > 0 ? (
                          <>
                            {quiz.submissions[0]?.nilai >=
                            (quiz.nilaiMaksimal || 75) ? (
                              <span className="text-sm text-green-600 font-medium">
                                ✅ Sudah dikerjakan (Nilai:{" "}
                                {quiz.submissions[0]?.nilai ?? 0})
                              </span>
                            ) : (
                              <div className="space-y-2">
                                <span className="text-sm text-orange-600 font-medium">
                                  ⚠️ Belum lulus KKM (Nilai:{" "}
                                  {quiz.submissions[0]?.nilai ?? 0})
                                </span>
                                {quiz.submissions.length < 3 &&
                                status === "active" ? (
                                  <div>
                                    <Link
                                      href={`/siswa/quizzes/${quiz.id}/start`}
                                    >
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                      >
                                        🔄 Remedial (
                                        {3 - quiz.submissions.length}x
                                        kesempatan)
                                      </Button>
                                    </Link>
                                  </div>
                                ) : quiz.submissions.length >= 3 ? (
                                  <span className="text-xs text-red-600">
                                    Kesempatan remedial habis
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">
                            ✅ Sudah dikerjakan
                          </span>
                        )}
                      </>
                    ) : status === "active" ? (
                      <Link href={`/siswa/quizzes/${quiz.id}/start`}>
                        <Button size="sm">Mulai Kuis</Button>
                      </Link>
                    ) : (
                      <Button size="sm" disabled>
                        {status === "upcoming"
                          ? "Belum dimulai"
                          : "Sudah berakhir"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
