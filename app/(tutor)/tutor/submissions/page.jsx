"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BookOpen,
  Calendar,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  Award
} from "lucide-react";

const statusMap = {
  NOT_STARTED: "Belum Dimulai",
  IN_PROGRESS: "Sedang Dikerjakan",
  SUBMITTED: "Sudah Dikumpulkan",
  GRADED: "Sudah Dinilai",
};

const jenisUjianMap = {
  MIDTERM: "Ujian Tengah Semester",
  FINAL: "Ujian Akhir Semester",
  EXERCISE: "Latihan",
  DAILY: "Ulangan Harian",
};

const statusColor = {
  NOT_STARTED: "bg-gray-100 text-gray-700 border border-gray-300",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  SUBMITTED: "bg-blue-100 text-blue-800 border border-blue-300",
  GRADED: "bg-green-100 text-green-800 border border-green-300",
};

const statusIcon = {
  NOT_STARTED: <Clock className="h-3 w-3" />,
  IN_PROGRESS: <Clock className="h-3 w-3" />,
  SUBMITTED: <FileText className="h-3 w-3" />,
  GRADED: <CheckCircle2 className="h-3 w-3" />,
};

// SubmissionCard Component
/* eslint-disable react/prop-types */
function SubmissionCard({ submission }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-base font-semibold line-clamp-1">
              {submission.assignment?.judul || submission.quiz?.judul}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              {submission.student.namaLengkap}
            </CardDescription>
          </div>
          <Badge className={`${statusColor[submission.status] || "bg-gray-100"} flex items-center gap-1 px-2`}>
            {statusIcon[submission.status]}
            {statusMap[submission.status] || submission.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="space-y-1">
            <p className="text-muted-foreground">NISN</p>
            <p className="font-medium">{submission.student.nisn}</p>
          </div>
          {submission.nilai != null && (
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" />
                Nilai
              </p>
              <p className="font-bold text-lg text-green-600">{submission.nilai}</p>
            </div>
          )}
          {submission.assignment?.jenis && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Jenis</p>
              <Badge variant="outline" className="text-xs">
                {jenisUjianMap[submission.assignment.jenis] ||
                  submission.assignment.jenis}
              </Badge>
            </div>
          )}
          {submission.waktuKumpul && (
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Waktu Kumpul
              </p>
              <p className="font-medium text-xs">
                {format(new Date(submission.waktuKumpul), "d MMM yyyy, HH:mm", {
                  locale: id,
                })}
              </p>
            </div>
          )}
        </div>
        <Link href={`/tutor/submissions/${submission.id}/review`} passHref>
          <Button variant="default" size="sm" className="w-full">
            <Eye className="h-3 w-3 mr-1" />
            Review Submission
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
/* eslint-enable react/prop-types */

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState({});
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axios.get("/api/academic-years");
        const years = Array.isArray(res.data?.data?.academicYears)
          ? res.data.data.academicYears
          : [];
        setAcademicYears(years);

        const active = years.find((y) => y.isActive);
        if (active) {
          setSelectedYear(active.id);
        }
      } catch {
        // Handle error silently
      }
    };

    fetchYears();
  }, []);

  // Fetch submissions berdasarkan tahun ajaran dan mata pelajaran
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedYear) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("academicYearId", selectedYear);
        if (selectedSubject && selectedSubject !== "all") {
          params.append("subjectId", selectedSubject);
        }

        const res = await axios.get(
          `/api/tutor/submissions?${params.toString()}`
        );
        const responseData = res.data.data || {};
        const subjects = res.data.availableSubjects || [];
        const filtered = res.data.isFiltered || false;

        setSubmissions(responseData);
        setAvailableSubjects(subjects);
        setIsFiltered(filtered);
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [selectedYear, selectedSubject]);

  // Calculate stats
  const totalSubmissions = isFiltered
    ? Array.isArray(submissions)
      ? submissions.length
      : 0
    : Object.values(submissions).reduce(
        (acc, curr) =>
          acc +
          (curr.assignments?.length || 0) +
          (curr.quizzes?.length || 0),
        0
      );

  const gradedCount = isFiltered
    ? Array.isArray(submissions)
      ? submissions.filter((s) => s.status === "GRADED").length
      : 0
    : Object.values(submissions).reduce(
        (acc, curr) =>
          acc +
          (curr.assignments?.filter((s) => s.status === "GRADED").length ||
            0) +
          (curr.quizzes?.filter((s) => s.status === "GRADED").length || 0),
        0
      );

  const pendingCount = totalSubmissions - gradedCount;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Daftar Pengumpulan Siswa"
        description="Review dan nilai pengumpulan tugas dan kuis siswa."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Pengumpulan Siswa" },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Pengumpulan"
          value={totalSubmissions}
          description="Semua submission"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Sudah Dinilai"
          value={gradedCount}
          description={`${gradedCount} dari ${totalSubmissions} submission`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend={gradedCount > 0 ? "up" : undefined}
        />
        <StatsCard
          title="Belum Dinilai"
          value={pendingCount}
          description="Menunggu review"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 mb-2">
                <Filter className="h-5 w-5" />
                Filter
              </CardTitle>
              <CardDescription>
                Filter berdasarkan tahun ajaran dan mata pelajaran
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Tahun Ajaran
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Pilih Tahun Ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.tahunMulai}/{year.tahunSelesai} - {year.semester}{" "}
                        {year.isActive && "(Aktif)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Mata Pelajaran
                </label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Semua Mapel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.namaMapel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Submissions List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isFiltered ? "Hasil Filter" : "Pengumpulan per Mata Pelajaran"}
            </CardTitle>
            <CardDescription>
              {totalSubmissions} pengumpulan ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFiltered ? (
              // Filtered view - show flat grid
              <div>
                {Array.isArray(submissions) && submissions.length === 0 ? (
                  <EmptyState
                    title="Tidak ada pengumpulan"
                    description="Belum ada submission untuk filter yang dipilih."
                    icon={<FileText className="h-6 w-6 text-muted-foreground" />}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(submissions) &&
                      submissions.map((sub) => (
                        <SubmissionCard key={sub.id} submission={sub} />
                      ))}
                  </div>
                )}
              </div>
            ) : (
              // Grouped view - show accordion by subject
              <div>
                {Object.keys(submissions).length === 0 ? (
                  <EmptyState
                    title="Tidak ada pengumpulan"
                    description="Belum ada submission untuk tahun ajaran ini."
                    icon={<FileText className="h-6 w-6 text-muted-foreground" />}
                  />
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(submissions).map(
                      ([subjectName, subjectData], index) => {
                        const totalItems =
                          (subjectData.assignments?.length || 0) +
                          (subjectData.quizzes?.length || 0);

                        return (
                          <AccordionItem key={subjectName} value={`subject-${index}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  <span className="font-semibold">
                                    {subjectName}
                                  </span>
                                </div>
                                <Badge variant="secondary" className="ml-2">
                                  {totalItems} submission
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-4">
                                {/* Assignments Section */}
                                {subjectData.assignments &&
                                  subjectData.assignments.length > 0 && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 px-2">
                                        <FileText className="h-4 w-4 text-green-600" />
                                        <h3 className="text-sm font-semibold text-green-700">
                                          Tugas ({subjectData.assignments.length})
                                        </h3>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {subjectData.assignments.map((sub) => (
                                          <SubmissionCard
                                            key={sub.id}
                                            submission={sub}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                {/* Quizzes Section */}
                                {subjectData.quizzes &&
                                  subjectData.quizzes.length > 0 && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 px-2">
                                        <Award className="h-4 w-4 text-blue-600" />
                                        <h3 className="text-sm font-semibold text-blue-700">
                                          Kuis ({subjectData.quizzes.length})
                                        </h3>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {subjectData.quizzes.map((sub) => (
                                          <SubmissionCard
                                            key={sub.id}
                                            submission={sub}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      }
                    )}
                  </Accordion>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
