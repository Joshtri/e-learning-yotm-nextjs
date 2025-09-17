"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileText,
  Eye,
  Calendar,
  Clock,
  Filter,
  BarChart3,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";

export default function TutorExamsPage() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    activeExams: 0,
    upcomingExams: 0,
    completedExams: 0,
  });

  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);

  useEffect(() => {
    const fetchYears = async () => {
      const res = await api.get("/academic-years");
      const years = res.data.data.academicYears;
      setAcademicYears(years);

      const active = years.find((y) => y.isActive);
      if (active) setSelectedAcademicYearId(active.id);
    };
    fetchYears();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/tutor/exams", {
        params: { academicYearId: selectedAcademicYearId },
      });
      const examsData = res.data.data || [];
      setData(examsData);

      // Calculate stats
      const now = new Date();
      const activeExams = examsData.filter((exam) => {
        const startDate = new Date(exam.waktuMulai);
        const endDate = new Date(exam.waktuSelesai);
        return startDate <= now && endDate >= now;
      });

      const upcomingExams = examsData.filter((exam) => {
        const startDate = new Date(exam.waktuMulai);
        return startDate > now;
      });

      const completedExams = examsData.filter((exam) => {
        const endDate = new Date(exam.waktuSelesai);
        return endDate < now;
      });

      setStats({
        totalExams: examsData.length,
        activeExams: activeExams.length,
        upcomingExams: upcomingExams.length,
        completedExams: completedExams.length,
      });
    } catch (error) {
      console.error("Gagal memuat ujian:", error);
      toast.error("Gagal memuat ujian");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAcademicYearId) {
      fetchData();
    }
  }, [selectedAcademicYearId]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter(
      (item) =>
        item.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.classSubjectTutor?.class?.namaKelas
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.classSubjectTutor?.subject?.namaMapel
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const getExamStatus = (exam) => {
    const now = new Date();
    const start = new Date(exam.waktuMulai);
    const end = new Date(exam.waktuSelesai);

    if (start > now) return { status: "pending", label: "Akan Datang" };
    if (start <= now && end >= now)
      return { status: "active", label: "Sedang Berlangsung" };
    return { status: "completed", label: "Selesai" };
  };

  const handleDelete = async (id) => {
    const confirmDelete = confirm(
      "Apakah Anda yakin ingin menghapus ujian ini?"
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/tutor/exams/${id}`);
      toast.success("Ujian berhasil dihapus");
      fetchData();
    } catch (error) {
      console.error("Gagal hapus ujian:", error);
      toast.error("Gagal menghapus ujian");
    }
  };

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Judul",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.judul}</div>
          <Badge variant="outline" className="mt-1">
            {row.jenis === "MIDTERM"
              ? "UTS"
              : row.jenis === "FINAL_EXAM"
              ? "UAS"
              : row.jenis === "DAILY_TEST"
              ? "Ujian Harian"
              : row.jenis === "START_SEMESTER_TEST"
              ? "Ujian Awal Semester"
              : "Ujian"}
          </Badge>
        </div>
      ),
    },
    {
      header: "Kelas & Mapel",
      cell: (row) => (
        <div>
          <div>{row.classSubjectTutor?.class?.namaKelas || "-"}</div>
          <div className="text-sm text-muted-foreground">
            {row.classSubjectTutor?.subject?.namaMapel || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Tanggal Mulai",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
            <span>
              {new Date(row.waktuMulai).toLocaleDateString("id-ID", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
            <span>
              {new Date(row.waktuMulai).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Tanggal Selesai",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
            <span>
              {new Date(row.waktuSelesai).toLocaleDateString("id-ID", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
            <span>
              {new Date(row.waktuSelesai).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => {
        const { status, label } = getExamStatus(row);
        return <StatusBadge status={status} label={label} />;
      },
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tutor/exams/${row.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              Detail
            </Link>
          </Button>

          {row.jenis !== "DAILY_TEST" &&
            row.jenis !== "START_SEMESTER_TEST" && (
              <Button variant="default" size="sm" asChild>
                <Link href={`/tutor/exams/${row.id}/submissions`}>
                  <FileText className="h-4 w-4 mr-1" />
                  Jawaban
                </Link>
              </Button>
            )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  // Filter exams by type
  const dailyTests = data.filter((exam) => exam.jenis === "DAILY_TEST");
  const startSemesterTests = data.filter(
    (exam) => exam.jenis === "START_SEMESTER_TEST"
  );
  const midterms = data.filter((exam) => exam.jenis === "MIDTERM");
  const finalExams = data.filter((exam) => exam.jenis === "FINAL_EXAM");

  // Get upcoming exams for the card
  const upcomingExams = data
    .filter((exam) => {
      const now = new Date();
      const startDate = new Date(exam.waktuMulai);
      return startDate > now;
    })
    .sort((a, b) => new Date(a.waktuMulai) - new Date(b.waktuMulai))
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Daftar Ujian"
        description="Kelola semua ujian yang telah Anda buat"
        actions={
          <Button asChild>
            <Link href="/tutor/exams/create">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Ujian
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor" },
          { label: "Ujian" },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Ujian"
          value={stats.totalExams}
          description="Ujian yang telah dibuat"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Sedang Berlangsung"
          value={stats.activeExams}
          description="Ujian yang sedang aktif"
          icon={<Clock className="h-4 w-4" />}
          trend={stats.activeExams > 0 ? "up" : undefined}
          trendValue={stats.activeExams > 0 ? "Aktif" : undefined}
        />
        <StatsCard
          title="Akan Datang"
          value={stats.upcomingExams}
          description="Ujian yang dijadwalkan"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatsCard
          title="Selesai"
          value={stats.completedExams}
          description="Ujian yang telah berakhir"
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="all" className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start flex-wrap gap-4">
                <TabsList className="overflow-x-auto">
                <TabsTrigger value="all">Semua</TabsTrigger>
                <TabsTrigger value="active">Berlangsung</TabsTrigger>
                <TabsTrigger value="upcoming">Akan Datang</TabsTrigger>
                <TabsTrigger value="completed">Selesai</TabsTrigger>
                <TabsTrigger value="daily">Harian</TabsTrigger>
                <TabsTrigger value="midterm">UTS</TabsTrigger>
                <TabsTrigger value="final">UAS</TabsTrigger>
              </TabsList>

              <DataToolbar
                searchValue={searchQuery}
                onSearchChange={(value) => setSearchQuery(value)}
                searchPlaceholder="Cari judul, kelas, atau mapel..."
                filterOptions={[
                  {
                    label: "Tahun Ajaran",
                    icon: <Filter className="h-4 w-4" />,
                    content: (
                      <div className="flex flex-col items-start justify-start">
                        <label className="text-sm font-medium mb-1">
                          Pilih Tahun Ajaran
                        </label>
                        <select
                          value={selectedAcademicYearId || ""}
                          onChange={(e) =>
                            setSelectedAcademicYearId(e.target.value)
                          }
                          className="border rounded-md px-3 py-1 text-sm min-w-[180px]"
                        >
                          {academicYears.map((year) => (
                            <option key={year.id} value={year.id}>
                              {year.tahunMulai}/{year.tahunSelesai}
                              {year.isActive ? " (Aktif)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    ),
                  },
                ]}
              />
            </div>

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredData}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat ujian..."
                emptyMessage="Belum ada ujian"
                keyExtractor={(item) => item.id}
              />
            </TabsContent>

            <TabsContent value="active">
              <DataTable
                data={filteredData.filter(
                  (exam) => getExamStatus(exam).status === "active"
                )}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="Tidak ada ujian yang sedang berlangsung"
              />
            </TabsContent>

            <TabsContent value="upcoming">
              <DataTable
                data={filteredData.filter(
                  (exam) => getExamStatus(exam).status === "pending"
                )}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="Tidak ada ujian yang akan datang"
              />
            </TabsContent>

            <TabsContent value="completed">
              <DataTable
                data={filteredData.filter(
                  (exam) => getExamStatus(exam).status === "completed"
                )}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="Tidak ada ujian yang telah selesai"
              />
            </TabsContent>

            <TabsContent value="daily">
              <DataTable
                data={dailyTests}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="Belum ada ujian harian"
              />
            </TabsContent>

            <TabsContent value="midterm">
              <DataTable
                data={midterms}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="Belum ada Ujian Tengah Semester (UTS)"
              />
            </TabsContent>

            <TabsContent value="final">
              <DataTable
                data={finalExams}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="Belum ada Ujian Akhir Semester (UAS)"
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ujian Mendatang</CardTitle>
              <CardDescription>
                Ujian yang akan datang dalam waktu dekat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingExams.length > 0 ? (
                upcomingExams.map((exam, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg border"
                  >
                    <div className="rounded-full p-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{exam.judul}</p>
                      <p className="text-xs text-muted-foreground">
                        {exam.classSubjectTutor?.class?.namaKelas} -{" "}
                        {exam.classSubjectTutor?.subject?.namaMapel}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(exam.waktuMulai).toLocaleDateString(
                            "id-ID"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(exam.waktuMulai).toLocaleTimeString(
                            "id-ID",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    Tidak ada ujian mendatang
                  </p>
                </div>
              )}

              {upcomingExams.length > 0 && (
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link href="/tutor/exams?tab=upcoming">
                    Lihat Semua Ujian Mendatang
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jenis Ujian</CardTitle>
              <CardDescription>
                Penjelasan singkat tentang jenis-jenis ujian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Harian
                  </Badge>
                  <span className="text-sm">
                    Ujian harian untuk evaluasi mingguan
                  </span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Awal Semester
                  </Badge>
                  <span className="text-sm">
                    Ujian di awal semester untuk mengukur kemampuan awal
                  </span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    UTS
                  </Badge>
                  <span className="text-sm">Ujian Tengah Semester</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    UAS
                  </Badge>
                  <span className="text-sm">Ujian Akhir Semester</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
