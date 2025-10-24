"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import api from "@/lib/axios";
import { toast } from "sonner";
import {
  Clock,
  Calendar,
  BookOpen,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  XCircle,
} from "lucide-react";

export default function StudentExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years");
      console.log("Academic Years Response:", res.data);

      const fetchedYears = res.data.data?.academicYears || [];
      setAcademicYears(fetchedYears);

      // Set default to active year or latest year
      if (fetchedYears.length > 0) {
        const activeYear = fetchedYears.find((year) => year.isActive);
        if (activeYear) {
          setSelectedAcademicYearId(activeYear.id);
        } else {
          setSelectedAcademicYearId(fetchedYears[0].id);
        }
      }
    } catch (err) {
      console.error("Gagal memuat tahun ajaran:", err);
      toast.error("Gagal memuat tahun ajaran");
    }
  };

  // Fetch exams based on selected academic year
  const fetchExams = async (academicYearId) => {
    if (!academicYearId) return;

    setIsLoading(true);
    try {
      console.log("Fetching exams for academicYearId:", academicYearId);
      const res = await api.get("/student/exams", {
        params: { academicYearId },
      });
      console.log("Exams Response:", res.data);

      if (res.data.success) {
        setExams(res.data.data || []);
        toast.success(`Berhasil memuat ${res.data.count || 0} ujian`);
      } else {
        console.error("API returned success: false");
        toast.error(res.data.message || "Gagal memuat ujian");
        setExams([]);
      }
    } catch (err) {
      console.error("Error fetching exams:", err);
      console.error("Error response:", err.response?.data);
      toast.error(
        err.response?.data?.message ||
          "Gagal memuat ujian. Cek console untuk detail."
      );
      setExams([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch academic years on mount
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Fetch exams when selectedAcademicYearId changes
  useEffect(() => {
    if (selectedAcademicYearId) {
      fetchExams(selectedAcademicYearId);
    }
  }, [selectedAcademicYearId]);

  // Group exams by type
  const groupedExams = {
    MIDTERM: exams.filter((e) => e.jenis === "MIDTERM"),
    FINAL_EXAM: exams.filter((e) => e.jenis === "FINAL_EXAM"),
  };

  // Get status badge variant
  const getStatusBadge = (exam) => {
    if (exam.submission?.status === "GRADED") {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Selesai Dinilai
        </Badge>
      );
    }
    if (exam.submission?.status === "SUBMITTED") {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          Menunggu Penilaian
        </Badge>
      );
    }
    if (exam.submission?.status === "IN_PROGRESS") {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          <PlayCircle className="h-3 w-3 mr-1" />
          Sedang Dikerjakan
        </Badge>
      );
    }
    if (exam.canStart) {
      return (
        <Badge variant="outline" className="bg-purple-100 text-purple-800">
          <PlayCircle className="h-3 w-3 mr-1" />
          Tersedia
        </Badge>
      );
    }
    if (exam.status === "Belum Dimulai") {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          <Clock className="h-3 w-3 mr-1" />
          Belum Dimulai
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Sudah Berakhir
      </Badge>
    );
  };

  // Format date to Indonesian locale
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Render exam card
  const renderExamCard = (exam) => (
    <Card key={exam.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{exam.judul}</h3>
              {exam.deskripsi && (
                <p className="text-sm text-muted-foreground mb-3">
                  {exam.deskripsi}
                </p>
              )}
            </div>
            {getStatusBadge(exam)}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{exam.subject?.namaMapel || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{exam.tutor?.namaLengkap || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{exam.class?.academicYear?.display || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{exam.jumlahSoal || 0} Soal</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{exam.batasWaktuMenit || 0} Menit</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span>Nilai Maksimal: {exam.nilaiMaksimal || 100}</span>
            </div>
          </div>

          {/* Date Range */}
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                <strong>Mulai:</strong> {formatDate(exam.TanggalMulai)}
              </div>
              <div>
                <strong>Selesai:</strong> {formatDate(exam.TanggalSelesai)}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            {exam.submission?.status === "GRADED" && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Nilai Anda:</span>
                <span className="text-xl font-bold text-green-700">
                  {exam.submission.nilai?.toFixed(2) || 0}/
                  {exam.nilaiMaksimal}
                </span>
              </div>
            )}
            {exam.submission?.status === "SUBMITTED" && (
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <span className="text-sm text-blue-800">
                  Menunggu penilaian dari guru
                </span>
              </div>
            )}
            {exam.canStart && !exam.submission && (
              <Button
                onClick={() => router.push(`/siswa/exams/${exam.id}/start`)}
                className="w-full"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Mulai Ujian
              </Button>
            )}
            {exam.submission?.status === "IN_PROGRESS" && (
              <Button
                onClick={() => router.push(`/siswa/exams/${exam.id}/start`)}
                className="w-full"
                variant="outline"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Lanjutkan Ujian
              </Button>
            )}
            {!exam.canStart &&
              !exam.submission &&
              exam.status === "Belum Dimulai" && (
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-600">
                    Ujian belum dimulai
                  </span>
                </div>
              )}
            {!exam.canStart &&
              !exam.submission &&
              exam.status === "Sudah Berakhir" && (
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <span className="text-sm text-red-600">
                    Waktu ujian telah berakhir
                  </span>
                </div>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6 space-y-6">
          <PageHeader
            title="Ujian Anda"
            description="Daftar ujian UTS dan UAS yang tersedia untuk dikerjakan"
            breadcrumbs={[
              { label: "Dashboard", href: "/siswa/dashboard" },
              { label: "Ujian" },
            ]}
          />

          {/* Academic Year Filter */}
          <div className="flex justify-end">
            <div className="w-full md:w-64">
              <Select
                value={selectedAcademicYearId || ""}
                onValueChange={setSelectedAcademicYearId}
                disabled={academicYears.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tahun Ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.tahunMulai}/{year.tahunSelesai} - {year.semester}
                      {year.isActive && " (Aktif)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Memuat ujian...</p>
            </div>
          ) : exams.length === 0 ? (
            /* Empty State */
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <p className="text-xl font-semibold">Belum Ada Ujian</p>
                  <p className="text-muted-foreground">
                    Belum ada ujian tersedia untuk tahun ajaran yang dipilih.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Exam Lists in Accordion */
            <Accordion
              type="multiple"
              defaultValue={["item-1", "item-2"]}
              className="space-y-4"
            >
              {/* UTS Section */}
              <AccordionItem value="item-1" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-left">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Ujian Tengah Semester (UTS)</span>
                    <Badge variant="secondary" className="ml-2">
                      {groupedExams.MIDTERM.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {groupedExams.MIDTERM.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Belum ada ujian UTS tersedia
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {groupedExams.MIDTERM.map(renderExamCard)}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* UAS Section */}
              <AccordionItem value="item-2" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-left">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Ujian Akhir Semester (UAS)</span>
                    <Badge variant="secondary" className="ml-2">
                      {groupedExams.FINAL_EXAM.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {groupedExams.FINAL_EXAM.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Belum ada ujian UAS tersedia
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {groupedExams.FINAL_EXAM.map(renderExamCard)}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </main>
      </div>
    </div>
  );
}