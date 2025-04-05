"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Info,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  User,
  Users,
  AlertCircle,
  ArrowUpRight,
  BookOpenCheck,
  BookText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard", {
          headers: {
            "x-user-id": localStorage.getItem("userId") || "",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy", { locale: id });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, "d MMM yyyy, HH:mm", { locale: id });
  };

  // Format time only
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: id });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "GRADED":
        return "text-green-600";
      case "SUBMITTED":
        return "text-blue-600";
      case "LATE":
        return "text-amber-600";
      case "IN_PROGRESS":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "GRADED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Dinilai
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Dikumpulkan
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <AlertCircle className="w-3 h-3 mr-1" /> Terlambat
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Clock className="w-3 h-3 mr-1" /> Sedang Dikerjakan
          </span>
        );
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Aktif
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" /> Tidak Aktif
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" /> Menunggu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Belum Mulai
          </span>
        );
    }
  };

  // Get role badge
  const getRoleBadge = (role) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Admin
          </span>
        );
      case "TUTOR":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Tutor
          </span>
        );
      case "STUDENT":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Siswa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {role}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p className="text-gray-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    overview,
    recentActivities,
    recentUsers,
    classes,
    programs,
    subjects,
    monthlyStats,
    todaysSchedule,
  } = dashboardData;

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Pengaturan
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Unduh Laporan
          </Button>
        </div>
      </div>

      {overview.currentAcademicYear && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <Info className="h-5 w-5 text-blue-500 mr-2" />
          <p className="text-blue-700">
            Tahun Akademik Aktif:{" "}
            <strong>{overview.currentAcademicYear.year}</strong>
          </p>
        </div>
      )}

      <Tabs
        defaultValue="overview"
        className="space-y-6"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="academic">Akademik</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Siswa
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.totalStudents}
                </div>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <p className="text-xs text-green-500">
                    +{monthlyStats[monthlyStats.length - 1]?.students || 0}{" "}
                    bulan ini
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Tutor
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalTutors}</div>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <p className="text-xs text-green-500">
                    +{monthlyStats[monthlyStats.length - 1]?.tutors || 0} bulan
                    ini
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Kelas
                </CardTitle>
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.totalClasses}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.totalPrograms} Program
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Tingkat Kelulusan
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    (overview.submissionStats.graded /
                      (overview.submissionStats.total || 1)) *
                      100
                  )}
                  %
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Rata-rata nilai:{" "}
                  {overview.submissionStats.averageScore.toFixed(1)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Second Row Stats */}
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Mata Pelajaran
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.totalSubjects}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Tugas
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.totalAssignments}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Kuis
                </CardTitle>
                <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.totalQuizzes}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Materi
                </CardTitle>
                <BookText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.totalMaterials}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
            {/* Recent Activities */}
            <Card className="col-span-full lg:col-span-4">
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>
                  Aktivitas pengguna dalam 7 hari terakhir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start p-3 border rounded-lg"
                      >
                        <div
                          className={`p-2 rounded-full mr-3 ${
                            activity.type === "submission"
                              ? "bg-blue-100"
                              : "bg-green-100"
                          }`}
                        >
                          {activity.type === "submission" ? (
                            <FileText
                              className={`h-5 w-5 ${
                                activity.type === "submission"
                                  ? "text-blue-600"
                                  : "text-green-600"
                              }`}
                            />
                          ) : (
                            <User className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{activity.title}</h4>
                            {getStatusBadge(activity.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {activity.user}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            <span>{formatDateTime(activity.date)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">
                        Tidak ada aktivitas terbaru
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card className="col-span-full lg:col-span-3">
              <CardHeader>
                <CardTitle>Jadwal Hari Ini</CardTitle>
                <CardDescription>Kelas dan kegiatan terjadwal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysSchedule.length > 0 ? (
                    todaysSchedule.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            item.type === "assignment"
                              ? "bg-blue-500"
                              : "bg-purple-500"
                          }`}
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {formatTime(item.startTime)} -{" "}
                            {formatTime(item.endTime)}
                            <span className="mx-1">•</span>
                            {item.subject}
                            <span className="mx-1">•</span>
                            {item.class}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">
                        Tidak ada jadwal untuk hari ini
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submission Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistik Pengumpulan</CardTitle>
              <CardDescription>
                Ringkasan status pengumpulan tugas dan kuis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Dikumpulkan</span>
                    <span className="text-sm font-medium">
                      {overview.submissionStats.submitted} /{" "}
                      {overview.submissionStats.total}
                    </span>
                  </div>
                  <Progress
                    value={
                      (overview.submissionStats.submitted /
                        (overview.submissionStats.total || 1)) *
                      100
                    }
                    className="h-2 bg-blue-100"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Dinilai</span>
                    <span className="text-sm font-medium">
                      {overview.submissionStats.graded} /{" "}
                      {overview.submissionStats.total}
                    </span>
                  </div>
                  <Progress
                    value={
                      (overview.submissionStats.graded /
                        (overview.submissionStats.total || 1)) *
                      100
                    }
                    className="h-2 bg-green-100"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Terlambat</span>
                    <span className="text-sm font-medium">
                      {overview.submissionStats.late} /{" "}
                      {overview.submissionStats.total}
                    </span>
                  </div>
                  <Progress
                    value={
                      (overview.submissionStats.late /
                        (overview.submissionStats.total || 1)) *
                      100
                    }
                    className="h-2 bg-amber-100"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      Sedang Dikerjakan
                    </span>
                    <span className="text-sm font-medium">
                      {overview.submissionStats.inProgress} /{" "}
                      {overview.submissionStats.total}
                    </span>
                  </div>
                  <Progress
                    value={
                      (overview.submissionStats.inProgress /
                        (overview.submissionStats.total || 1)) *
                      100
                    }
                    className="h-2 bg-purple-100"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Belum Mulai</span>
                    <span className="text-sm font-medium">
                      {overview.submissionStats.notStarted} /{" "}
                      {overview.submissionStats.total}
                    </span>
                  </div>
                  <Progress
                    value={
                      (overview.submissionStats.notStarted /
                        (overview.submissionStats.total || 1)) *
                      100
                    }
                    className="h-2 bg-gray-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Analitik Platform</h2>
            <div className="flex gap-2">
              <Select defaultValue="6">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Bulan Terakhir</SelectItem>
                  <SelectItem value="6">6 Bulan Terakhir</SelectItem>
                  <SelectItem value="12">1 Tahun Terakhir</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Ekspor
              </Button>
            </div>
          </div>

          {/* Monthly Stats Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tren Bulanan</CardTitle>
              <CardDescription>
                Statistik pendaftaran dan pengumpulan tugas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex flex-col">
                <div className="flex justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Siswa Baru</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Tutor Baru</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Tugas Dikumpulkan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm">Tugas Dinilai</span>
                  </div>
                </div>

                <div className="flex-1 flex items-end">
                  <div className="w-full flex h-[300px]">
                    {monthlyStats.map((month, index) => (
                      <div
                        key={index}
                        className="flex-1 flex flex-col justify-end items-center gap-1"
                      >
                        <div className="text-xs text-gray-500 mb-2">
                          {month.label}
                        </div>

                        <div
                          className="w-4 bg-blue-500 rounded-t"
                          style={{
                            height: `${
                              (month.students /
                                Math.max(
                                  ...monthlyStats.map((m) => m.students || 1)
                                )) *
                              200
                            }px`,
                          }}
                        ></div>

                        <div
                          className="w-4 bg-green-500 rounded-t"
                          style={{
                            height: `${
                              (month.tutors /
                                Math.max(
                                  ...monthlyStats.map((m) => m.tutors || 1),
                                  1
                                )) *
                              200
                            }px`,
                          }}
                        ></div>

                        <div
                          className="w-4 bg-purple-500 rounded-t"
                          style={{
                            height: `${
                              (month.submitted /
                                Math.max(
                                  ...monthlyStats.map((m) => m.submitted || 1),
                                  1
                                )) *
                              200
                            }px`,
                          }}
                        ></div>

                        <div
                          className="w-4 bg-amber-500 rounded-t"
                          style={{
                            height: `${
                              (month.graded /
                                Math.max(
                                  ...monthlyStats.map((m) => m.graded || 1),
                                  1
                                )) *
                              200
                            }px`,
                          }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Program and Subject Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistik Program</CardTitle>
                <CardDescription>Distribusi siswa per program</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {programs.map((program) => (
                    <div key={program.id} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          {program.name}
                        </span>
                        <span className="text-sm font-medium">
                          {program.totalStudents} Siswa
                        </span>
                      </div>
                      <Progress
                        value={
                          (program.totalStudents /
                            Math.max(
                              ...programs.map((p) => p.totalStudents),
                              1
                            )) *
                          100
                        }
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500">
                        {program.totalClasses} Kelas
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistik Mata Pelajaran</CardTitle>
                <CardDescription>
                  Mata pelajaran dengan siswa terbanyak
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjects
                    .sort((a, b) => b.totalStudents - a.totalStudents)
                    .slice(0, 5)
                    .map((subject) => (
                      <div key={subject.id} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            {subject.name}
                          </span>
                          <span className="text-sm font-medium">
                            {subject.totalStudents} Siswa
                          </span>
                        </div>
                        <Progress
                          value={
                            (subject.totalStudents /
                              Math.max(
                                ...subjects.map((s) => s.totalStudents),
                                1
                              )) *
                            100
                          }
                          className="h-2"
                        />
                        <p className="text-xs text-gray-500">
                          {subject.totalClasses} Kelas
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Manajemen Pengguna</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Cari pengguna..."
                  className="pl-8 w-[250px]"
                />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pengguna
              </Button>
            </div>
          </div>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Pengguna Terbaru</CardTitle>
              <CardDescription>
                Daftar pengguna yang baru terdaftar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Tanggal Daftar</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Lihat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/admin/users")}
              >
                Lihat Semua Pengguna
              </Button>
            </CardFooter>
          </Card>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Peran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Siswa</span>
                      <span className="text-sm font-medium">
                        {overview.totalStudents}
                      </span>
                    </div>
                    <Progress
                      value={
                        (overview.totalStudents /
                          (overview.totalStudents + overview.totalTutors + 1)) *
                        100
                      }
                      className="h-2 bg-green-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Tutor</span>
                      <span className="text-sm font-medium">
                        {overview.totalTutors}
                      </span>
                    </div>
                    <Progress
                      value={
                        (overview.totalTutors /
                          (overview.totalStudents + overview.totalTutors + 1)) *
                        100
                      }
                      className="h-2 bg-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Admin</span>
                      <span className="text-sm font-medium">1</span>
                    </div>
                    <Progress
                      value={
                        (1 /
                          (overview.totalStudents + overview.totalTutors + 1)) *
                        100
                      }
                      className="h-2 bg-purple-100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pertumbuhan Pengguna</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-end">
                  <div className="w-full flex h-full">
                    {monthlyStats.map((month, index) => (
                      <div
                        key={index}
                        className="flex-1 flex flex-col justify-end items-center gap-1"
                      >
                        <div
                          className="w-6 bg-blue-500 rounded-t"
                          style={{
                            height: `${
                              (month.students /
                                Math.max(
                                  ...monthlyStats.map((m) => m.students || 1)
                                )) *
                              150
                            }px`,
                          }}
                        ></div>
                        <div className="text-xs text-gray-500">
                          {month.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/admin/users")}
                  >
                    <User className="h-5 w-5 mb-1" />
                    <span>Tambah Pengguna</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/admin/users/import")}
                  >
                    <Users className="h-5 w-5 mb-1" />
                    <span>Impor Pengguna</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/admin/users/export")}
                  >
                    <Download className="h-5 w-5 mb-1" />
                    <span>Ekspor Data</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/admin/users/settings")}
                  >
                    <Settings className="h-5 w-5 mb-1" />
                    <span>Pengaturan</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ACADEMIC TAB */}
        <TabsContent value="academic" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Manajemen Akademik</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/subject")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Mata Pelajaran
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/program-subject")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Mata Pelajaran per Paket
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/programs")}
              >
                <Layers className="h-4 w-4 mr-2" />
                Program
              </Button>
              <Button onClick={() => router.push("/admin/classes")}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kelas
              </Button>
            </div>
          </div>

          {/* Classes List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Kelas</CardTitle>
              <CardDescription>
                Kelas yang tersedia dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kelas</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Tahun Akademik</TableHead>
                    <TableHead>Jumlah Siswa</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{cls.program}</TableCell>
                      <TableCell>{cls.academicYear}</TableCell>
                      <TableCell>{cls.studentCount}</TableCell>
                      <TableCell>{cls.subjectCount}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/classes/${cls.id}`)
                          }
                        >
                          Lihat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/admin/classes")}
              >
                Lihat Semua Kelas
              </Button>
            </CardFooter>
          </Card>

          {/* Academic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Populer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {programs
                    .sort((a, b) => b.totalStudents - a.totalStudents)
                    .slice(0, 3)
                    .map((program) => (
                      <div key={program.id} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            {program.name}
                          </span>
                          <span className="text-sm font-medium">
                            {program.totalStudents} Siswa
                          </span>
                        </div>
                        <Progress
                          value={
                            (program.totalStudents /
                              Math.max(
                                ...programs.map((p) => p.totalStudents),
                                1
                              )) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mata Pelajaran Populer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjects
                    .sort((a, b) => b.totalStudents - a.totalStudents)
                    .slice(0, 3)
                    .map((subject) => (
                      <div key={subject.id} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            {subject.name}
                          </span>
                          <span className="text-sm font-medium">
                            {subject.totalStudents} Siswa
                          </span>
                        </div>
                        <Progress
                          value={
                            (subject.totalStudents /
                              Math.max(
                                ...subjects.map((s) => s.totalStudents),
                                1
                              )) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/admin/academic-years")}
                  >
                    <Calendar className="h-5 w-5 mb-1" />
                    <span>Tahun Akademik</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/admin/subject")}
                  >
                    <BookOpen className="h-5 w-5 mb-1" />
                    <span>Mata Pelajaran</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/admin/programs")}
                  >
                    <Layers className="h-5 w-5 mb-1" />
                    <span>Program</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/admin/academic/assignments")}
                  >
                    <FileText className="h-5 w-5 mb-1" />
                    <span>Tugas & Kuis</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
