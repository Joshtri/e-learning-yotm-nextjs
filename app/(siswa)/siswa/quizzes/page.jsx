"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SkeletonTable from "@/components/ui/skeleton/SkeletonTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StudentQuizListPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years?limit=100"); // Fetch all academic years
      setAcademicYears(res.data.data.academicYears);
    } catch (err) {
      toast.error("Gagal memuat tahun ajaran");
    }
  };

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

  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYearId) {
      // Set default to the latest active academic year if available
      const activeYear = academicYears.find(ay => ay.isActive);
      if (activeYear) {
        setSelectedAcademicYearId(activeYear.id);
        setSelectedSemester(activeYear.semester);
      } else {
        // Fallback to the latest academic year if no active one
        const latestYear = academicYears[0];
        setSelectedAcademicYearId(latestYear.id);
        setSelectedSemester(latestYear.semester);
      }
    }
  }, [academicYears, selectedAcademicYearId]);

  useEffect(() => {
    if (selectedAcademicYearId && selectedSemester) {
      fetchQuizzes(selectedAcademicYearId, selectedSemester);
    }
  }, [selectedAcademicYearId, selectedSemester]);

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
                <Select
                  value={selectedAcademicYearId}
                  onValueChange={setSelectedAcademicYearId}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pilih Tahun Ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((ay) => (
                      <SelectItem key={ay.id} value={ay.id}>
                        {ay.tahunMulai}/{ay.tahunSelesai} {ay.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
      
                <Select
                  value={selectedSemester}
                  onValueChange={setSelectedSemester}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pilih Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GANJIL">GANJIL</SelectItem>
                    <SelectItem value="GENAP">GENAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
      
      {isLoadingQuizzes ? (
        <SkeletonTable numCols={4} numRows={5} showHeader />
      ) : quizzes.length === 0 ? (
        <p className="text-muted-foreground">Tidak ada kuis aktif saat ini.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
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
                  Tahun Ajaran: {quiz.classSubjectTutor.class.academicYear.tahunMulai}/{
                    quiz.classSubjectTutor.class.academicYear.tahunSelesai
                  } - {quiz.classSubjectTutor.class.academicYear.semester}
                </div>
                <div className="text-xs text-muted-foreground">
                  Waktu: {new Date(quiz.waktuMulai).toLocaleString("id-ID")} -{" "}
                  {new Date(quiz.waktuSelesai).toLocaleString("id-ID")}
                </div>

                {/* ✅ Button Mulai Kuis */}
                <div className="pt-2">
                  {quiz.sudahDikerjakan ? (
                    <span className="text-sm text-green-600 font-medium">
                      ✅ Sudah dikerjakan (Nilai : {quiz.submissions[0]?.nilai ?? 0})
                    </span>
                  ) : (
                    <Link href={`/siswa/quizzes/${quiz.id}/start`}>
                      <Button size="sm">Mulai Kuis</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
