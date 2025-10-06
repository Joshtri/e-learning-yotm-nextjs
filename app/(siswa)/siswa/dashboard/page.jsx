"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  FileText,
  BookOpen,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Book,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import axios from "axios";

export default function StudentDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndDashboard = async () => {
      try {
        // Ambil data user dari /api/auth/me
        const userRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include", // penting untuk pastikan cookie dikirim
        });

        if (!userRes.ok) throw new Error("Unauthorized");

        const { user } = await userRes.json();
        if (!user || user.role !== "STUDENT") {
          router.replace("/auth/login");
          return;
        }

        // Cek profil student
        const profileRes = await fetch(
          `/api/users/check-profile?userId=${user.id}&role=STUDENT`,
          { cache: "no-store" }
        );

        if (!profileRes.ok) {
          throw new Error("Gagal memverifikasi profil student");
        }

        const { hasProfile } = await profileRes.json();
        if (!hasProfile) {
          router.replace("/onboarding/siswa");
          return;
        }

        // Ambil data dashboard student
        const dashboardRes = await fetch("/api/student/dashboard", {
          cache: "no-store",
          credentials: "include",
        });

        if (!dashboardRes.ok) {
          const { message } = await dashboardRes.json();
          throw new Error(message || "Gagal memuat dashboard");
        }

        const dashboard = await dashboardRes.json();
        setDashboardData(dashboard);
      } catch (err) {
        console.error("Student Dashboard Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndDashboard();
  }, [router]);

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
    student,
    upcomingAssignments,
    upcomingQuizzes,
    recentSubmissions,
    recentMaterials,
    statistics,
  } = dashboardData;

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
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Belum Mulai
          </span>
        );
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Selamat Datang, {student.name}
        </h1>
        <p className="text-gray-600">
          {student.class} | Tahun Ajaran {student.academicYear}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Tugas Selesai
                </p>
                <p className="text-2xl font-bold">
                  {statistics.submissions.completed}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress
              value={
                (statistics.submissions.completed /
                  statistics.submissions.total) *
                100
              }
              className="h-1 mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Nilai Rata-rata
                </p>
                <p className="text-2xl font-bold">
                  {statistics.submissions.averageScore.toFixed(1)}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress
              value={statistics.submissions.averageScore}
              className="h-1 mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Tugas Dinilai
                </p>
                <p className="text-2xl font-bold">
                  {statistics.submissions.graded}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <Progress
              value={
                (statistics.submissions.graded / statistics.submissions.total) *
                100
              }
              className="h-1 mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Mata Pelajaran
                </p>
                <p className="text-2xl font-bold">
                  {statistics.subjects.length}
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <Book className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="h-1 mt-3"></div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Tugas Mendatang</CardTitle>
              <CardDescription>
                Tugas dan kuis yang perlu diselesaikan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="assignments">
                <TabsList className="mb-4">
                  <TabsTrigger value="assignments">Tugas</TabsTrigger>
                  <TabsTrigger value="quizzes">Kuis</TabsTrigger>
                </TabsList>

                <TabsContent value="assignments">
                  {upcomingAssignments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            router.push(`/student/assignments/${assignment.id}`)
                          }
                        >
                          <div className="p-2 bg-blue-100 rounded-full mr-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-sm text-gray-600">
                              {assignment.subject}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(assignment.dueDate)}</span>
                            </div>
                          </div>
                          <div className="ml-2 text-xs font-medium">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {assignment.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">Tidak ada tugas mendatang</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="quizzes">
                  {upcomingQuizzes.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingQuizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            router.push(`/student/quizzes/${quiz.id}`)
                          }
                        >
                          <div className="p-2 bg-purple-100 rounded-full mr-3">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{quiz.title}</h4>
                            <p className="text-sm text-gray-600">
                              {quiz.subject}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(quiz.dueDate)}</span>
                              <Clock className="h-3 w-3 ml-2 mr-1" />
                              <span>{quiz.duration} menit</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">Tidak ada kuis mendatang</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/siswa/assignments/list")}
              >
                Lihat Semua Tugas
              </Button>
            </CardFooter>
          </Card>

          {/* Recent Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Pengumpulan Terbaru</CardTitle>
              <CardDescription>
                Tugas dan kuis yang telah dikumpulkan pada tahun ajaran {student.academicYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      // onClick={() =>
                      //   router.push(`/siswa/submissions/${submission.id}`)
                      // }
                    >
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{submission.title}</h4>
                          {getStatusBadge(submission.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {submission.subject}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xs text-gray-500">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            <span>
                              {formatDateTime(submission.submittedAt)}
                            </span>
                          </div>
                          {submission.score !== null && (
                            <div className="text-sm font-medium">
                              Nilai:{" "}
                              <span className="text-green-600">
                                {submission.score}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">Belum ada pengumpulan tugas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performa Mata Pelajaran</CardTitle>
              <CardDescription>
                Nilai rata-rata per mata pelajaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.subjects.length > 0 ? (
                <div className="space-y-4">
                  {statistics.subjects.map((subject) => (
                    <div key={subject.id} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          {subject.name}
                        </span>
                        <span className="text-sm font-medium">
                          {subject.averageScore.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={subject.averageScore} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">Belum ada data performa</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Materials */}
          <Card>
            <CardHeader>
              <CardTitle>Materi Terbaru</CardTitle>
              <CardDescription>Materi pembelajaran terbaru</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMaterials.length > 0 ? (
                <div className="space-y-4">
                  {recentMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        router.push(`/student/materials/${material.id}`)
                      }
                    >
                      <div className="p-2 bg-green-100 rounded-full mr-3">
                        <BookOpen className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{material.title}</h4>
                        <p className="text-sm text-gray-600">
                          {material.subject}
                        </p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(material.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">Belum ada materi terbaru</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/siswa/learning-materials")}
              >
                Lihat Semua Materi
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
