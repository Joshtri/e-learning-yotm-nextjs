"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  FileText,
  ClipboardList,
  Award,
  Inbox,
  BookOpen,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";

export default function ExamScoresPage() {
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years");
      console.log("Academic Years Response:", res.data);

      const fetchedYears = res.data.data?.academicYears || [];
      console.log("Fetched Academic Years:", fetchedYears);

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

  // Fetch scores based on selected academic year
  const fetchScores = async (academicYearId) => {
    if (!academicYearId) return;

    setIsLoading(true);
    try {
      console.log("Fetching scores for academicYearId:", academicYearId);
      const res = await api.get("/student/exams-scores", {
        params: { academicYearId },
      });
      console.log("Scores Response:", res.data);

      if (res.data.success) {
        setScores(res.data.data || []);
        toast.success(`Berhasil memuat ${res.data.count || 0} nilai ujian`);
      } else {
        console.error("API returned success: false");
        toast.error(res.data.message || "Gagal memuat nilai ujian");
        setScores([]);
      }
    } catch (err) {
      console.error("Error fetching scores:", err);
      console.error("Error response:", err.response?.data);
      toast.error(
        err.response?.data?.message ||
          "Gagal memuat nilai ujian. Cek console untuk detail."
      );
      setScores([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch academic years on mount
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Fetch scores when selectedAcademicYearId changes
  useEffect(() => {
    if (selectedAcademicYearId) {
      fetchScores(selectedAcademicYearId);
    }
  }, [selectedAcademicYearId]);

  // Group scores by exam type
  const groupScores = {
    DAILY_TEST: [],
    START_SEMESTER_TEST: [],
    MIDTERM: [],
    FINAL_EXAM: [],
  };

  scores.forEach((item) => {
    if (item.jenis && groupScores[item.jenis]) {
      groupScores[item.jenis].push(item);
    }
  });

  // Render a list of scores for a specific exam type
  const renderScoreList = (items, title, icon) => (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Belum ada nilai tersedia untuk kategori ini.
          </p>
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col md:flex-row md:items-center md:justify-between border p-4 rounded-lg hover:bg-accent/50 transition-colors gap-4"
          >
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {item.subject?.namaMapel || "-"}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {item.tutor?.namaLengkap || "-"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {item.tahunAjaran} - {item.semester}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end mt-3 md:mt-0 gap-2">
              <div className="text-right">
                <span className="font-bold text-2xl">
                  {item.nilai !== null && item.nilai !== undefined
                    ? item.nilai.toFixed(2)
                    : "-"}
                </span>
                <span className="text-muted-foreground ml-1">
                  /{item.nilaiMaksimal}
                </span>
              </div>
              <Badge
                variant={
                  item.statusKelulusan === "LULUS" ? "outline" : "destructive"
                }
                className={
                  item.statusKelulusan === "LULUS"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                }
              >
                {item.statusKelulusan === "LULUS" ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Lulus
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Tidak Lulus
                  </span>
                )}
              </Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6 space-y-6">
          <PageHeader
            title="Rekapitulasi Nilai Ujian"
            description="Lihat hasil ujian Anda dari semua kategori."
            breadcrumbs={[
              { label: "Dashboard", href: "/siswa/dashboard" },
              { label: "Rekap Nilai" },
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
              <p className="text-muted-foreground">Memuat nilai ujian...</p>
            </div>
          ) : scores.length === 0 ? (
            /* Empty State */
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <p className="text-xl font-semibold">
                    Belum Ada Nilai Tersedia
                  </p>
                  <p className="text-muted-foreground">
                    Anda belum memiliki nilai ujian untuk tahun ajaran yang
                    dipilih.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Accordion for Score Categories */
            <Accordion
              type="multiple"
              defaultValue={["item-1", "item-2", "item-3", "item-4"]}
              className="space-y-4"
            >
              <AccordionItem
                value="item-1"
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-left">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Nilai Ujian Harian</span>
                    <Badge variant="secondary" className="ml-2">
                      {groupScores.DAILY_TEST.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {renderScoreList(
                    groupScores.DAILY_TEST,
                    "Nilai Ujian Harian",
                    <ClipboardList className="h-5 w-5" />
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-2"
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-left">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-semibold">
                      Nilai Ujian Awal Semester
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {groupScores.START_SEMESTER_TEST.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {renderScoreList(
                    groupScores.START_SEMESTER_TEST,
                    "Nilai Ujian Awal Semester",
                    <FileText className="h-5 w-5" />
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-3"
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-left">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="font-semibold">
                      Nilai Ujian Tengah Semester (UTS)
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {groupScores.MIDTERM.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {renderScoreList(
                    groupScores.MIDTERM,
                    "Nilai Ujian Tengah Semester (UTS)",
                    <Award className="h-5 w-5" />
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-4"
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-left">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="font-semibold">
                      Nilai Ujian Akhir Semester (UAS)
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {groupScores.FINAL_EXAM.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {renderScoreList(
                    groupScores.FINAL_EXAM,
                    "Nilai Ujian Akhir Semester (UAS)",
                    <Award className="h-5 w-5" />
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
