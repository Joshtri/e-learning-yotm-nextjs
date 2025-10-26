"use client";

import { OnboardingDialog } from "@/components/Onboard/OnboardDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  Plus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TutorDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Separate state for each data type
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [recentActivities, setRecentActivities] = useState({
    recentAssignments: [],
    recentQuizzes: [],
    recentMaterials: [],
  });
  const [submissions, setSubmissions] = useState([]);
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    totalAssignments: 0,
    totalQuizzes: 0,
    submissions: {
      submitted: 0,
      graded: 0,
      late: 0,
      total: 0,
      averageScore: 0,
    },
  });

  useEffect(() => {
    const fetchUserAndDashboard = async () => {
      try {
        setLoading(true);

        // 1. First check if user is authenticated
        const userRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!userRes.ok) {
          router.replace("/");
          return;
        }

        const userData = await userRes.json();
        const user = userData.user;

        if (!user) {
          router.replace("/");
          return;
        }

        setCurrentUser(user);

        // 2. Check if user has tutor role
        if (user.role !== "TUTOR") {
          router.replace("/");
          return;
        }

        // 3. Check if tutor profile exists
        const profileRes = await fetch(
          `/api/users/check-profile?userId=${user.id}&role=${user.role}`
        );
        const profileData = await profileRes.json();

        if (!profileData.hasProfile) {
          router.replace("/onboarding/tutor");
          return;
        }

        // 4. Fetch all dashboard data in parallel
        const [
          profileResponse,
          classesResponse,
          recentResponse,
          submissionsResponse,
          statsResponse,
        ] = await Promise.all([
          fetch("/api/tutor/dashboard/profile"),
          fetch("/api/tutor/dashboard/classes"),
          fetch("/api/tutor/dashboard/recent"),
          fetch("/api/tutor/dashboard/submissions"),
          fetch("/api/tutor/dashboard/stats"), // You might need to create this endpoint
        ]);

        if (!profileResponse.ok) throw new Error("Failed to fetch profile");
        if (!classesResponse.ok) throw new Error("Failed to fetch classes");
        if (!recentResponse.ok)
          throw new Error("Failed to fetch recent activities");
        if (!submissionsResponse.ok)
          throw new Error("Failed to fetch submissions");
        if (!statsResponse.ok) throw new Error("Failed to fetch statistics");

        // In your fetchUserAndDashboard function, fix the Promise.all destructuring:
        const [
          profileDetails,
          classesData,
          recentData,
          submissionsData,
          statsData,
        ] = await Promise.all([
          profileResponse.json(),
          classesResponse.json(),
          recentResponse.json(),
          submissionsResponse.json(),
          statsResponse.json(),
        ]);

        // Then set all the states:
        setProfile(profileDetails.tutor);
        setClasses(classesData.classes);
        setRecentActivities({
          recentAssignments: recentData.recentAssignments || [],
          recentQuizzes: recentData.recentQuizzes || [],
          recentMaterials: recentData.recentMaterials || [],
        });
        setSubmissions(submissionsData.submissions || []);
        setStatistics(
          statsData.statistics || {
            totalStudents: 0,
            totalAssignments: 0,
            totalQuizzes: 0,
            submissions: {
              submitted: 0,
              graded: 0,
              late: 0,
              total: 0,
              averageScore: 0,
            },
          }
        );
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);

        if (err.message.includes("tutor profile")) {
          router.replace("/onboarding/tutor");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndDashboard();
  }, [router]);

  if (loading) {
    return <DashboardSkeleton variant="tutor" />;
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

  if (!profile) {
    return null;
  }

  // Format date function
  // Format date function with error handling
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "No date";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, "d MMMM yyyy", { locale: id });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Format date with time with error handling
  const formatDateTime = (dateString) => {
    try {
      if (!dateString) return "No date";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, "d MMM yyyy, HH:mm", { locale: id });
    } catch (error) {
      console.error("Error formatting date time:", error);
      return "Invalid date";
    }
  };
  return (
    <>
      {currentUser && (
        <OnboardingDialog key={currentUser.id} user={currentUser} />
      )}

      <div className="container mx-auto py-6 px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Selamat Datang, {profile.name}
          </h1>
          <p className="text-gray-600">{profile.bio || "Tutor"}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Siswa
                  </p>
                  <p className="text-2xl font-bold">
                    {statistics.totalStudents}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card>
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
          </Card> */}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Tugas
                  </p>
                  <p className="text-2xl font-bold">
                    {statistics.totalAssignments + statistics.totalQuizzes}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Perlu Dinilai
                  </p>
                  <p className="text-2xl font-bold">
                    {statistics.submissions.submitted}
                  </p>
                </div>
                <div className="p-2 bg-amber-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <Progress
                value={
                  (statistics.submissions.submitted /
                    statistics.submissions.total) *
                  100
                }
                className="h-1 mt-3"
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Classes Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Kelas yang Diajar</CardTitle>
                  <CardDescription>
                    Kelas dan mata pelajaran yang Anda ajar
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push("/tutor/my-classes")}
                >
                  Lihat Semua
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classes.map((cls, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/tutor/classes/${cls.classId}/subjects/${encodeURIComponent(cls.subject)}`
                        )
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            {cls.className} - {cls.program}
                          </h3>
                          <p className="text-sm text-gray-600">{cls.subject}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Tahun Ajaran {cls.academicYear} •{" "}
                            {cls.totalStudents} Siswa
                          </p>
                          <p className="text-xs text-gray-500">
                            Wali Kelas:{" "}
                            {cls.homeroomTeacher || "Belum ditentukan"}
                          </p>
                        </div>
                        {/* <div className="text-right">
                          <div className="text-sm font-medium">
                            Nilai Rata-rata:{" "}
                            <span className="text-green-600">
                              {cls.averageScore?.toFixed(1) || "0.0"}
                            </span>
                          </div>
                        </div> */}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Content */}
            <Card>
              <CardHeader>
                <CardTitle>Konten Terbaru</CardTitle>
                <CardDescription>
                  Tugas, kuis, dan materi yang baru dibuat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="assignments">
                  <TabsList className="mb-4">
                    <TabsTrigger value="assignments">Tugas</TabsTrigger>
                    <TabsTrigger value="quizzes">Kuis</TabsTrigger>
                    <TabsTrigger value="materials">Materi</TabsTrigger>
                  </TabsList>

                  <TabsContent value="assignments">
                    {recentActivities.recentAssignments.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivities.recentAssignments.map(
                          (assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() =>
                                router.push(
                                  `/tutor/assignments/${assignment.id}`
                                )
                              }
                            >
                              <div className="p-2 bg-blue-100 rounded-full mr-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {assignment.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {
                                    assignment.classSubjectTutor?.subject
                                      ?.namaMapel
                                  }{" "}
                                  •{" "}
                                  {
                                    assignment.classSubjectTutor?.class
                                      ?.namaKelas
                                  }
                                </p>
                                <p className="text-xs text-gray-500">
                                  Wali Kelas:{" "}
                                  {assignment.classSubjectTutor?.class
                                    ?.homeroomTeacher?.namaLengkap ||
                                    "Belum ditentukan"}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                  <div className="text-xs text-gray-500">
                                    <Calendar className="inline h-3 w-3 mr-1" />
                                    <span>
                                      Tenggat: {formatDate(assignment.dueDate)}
                                    </span>
                                  </div>
                                  <div className="text-xs">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                      {assignment.submissions?.length || 0}{" "}
                                      Pengumpulan
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">Belum ada tugas</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="quizzes">
                    {recentActivities.recentQuizzes.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivities.recentQuizzes.map((quiz) => (
                          <div
                            key={quiz.id}
                            className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              router.push(`/tutor/quizzes/${quiz.id}`)
                            }
                          >
                            <div className="p-2 bg-purple-100 rounded-full mr-3">
                              <FileText className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{quiz.title}</h4>
                              <p className="text-sm text-gray-600">
                                {quiz.classSubjectTutor?.subject?.namaMapel} •{" "}
                                {quiz.classSubjectTutor?.class?.namaKelas}
                              </p>
                              <p className="text-xs text-gray-500">
                                Wali Kelas:{" "}
                                {quiz.classSubjectTutor?.class?.homeroomTeacher
                                  ?.namaLengkap || "Belum ditentukan"}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <div className="text-xs text-gray-500">
                                  <Calendar className="inline h-3 w-3 mr-1" />
                                  <span>
                                    Tenggat: {formatDate(quiz.dueDate)}
                                  </span>
                                  <Clock className="inline h-3 w-3 ml-2 mr-1" />
                                  <span>{quiz.duration} menit</span>
                                </div>
                                <div className="text-xs">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                    {quiz.submissions?.length || 0} Pengumpulan
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">Belum ada kuis</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="materials">
                    {recentActivities.recentMaterials.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivities.recentMaterials.map((material) => (
                          <div
                            key={material.id}
                            className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              router.push(`/tutor/materials/${material.id}`)
                            }
                          >
                            <div className="p-2 bg-green-100 rounded-full mr-3">
                              <BookOpen className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{material.title}</h4>
                              <p className="text-sm text-gray-600">
                                {material.classSubjectTutor?.subject?.namaMapel}{" "}
                                • {material.classSubjectTutor?.class?.namaKelas}
                              </p>
                              <p className="text-xs text-gray-500">
                                Wali Kelas:{" "}
                                {material.classSubjectTutor?.class
                                  ?.homeroomTeacher?.namaLengkap ||
                                  "Belum ditentukan"}
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
                        <p className="text-gray-500">Belum ada materi</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/tutor/assignments/create")}
                >
                  <Plus className="h-4 w-4 mr-1" /> Tugas
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/tutor/quizzes/create")}
                >
                  <Plus className="h-4 w-4 mr-1" /> Kuis
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/tutor/materials")}
                >
                  <Plus className="h-4 w-4 mr-1" /> Materi
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/tutor/assignments/create")}
                  >
                    <FileText className="h-5 w-5 mb-1" />
                    <span>Buat Tugas</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/tutor/quizzes/create")}
                  >
                    <FileText className="h-5 w-5 mb-1" />
                    <span>Buat Kuis</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/tutor/materials")}
                  >
                    <BookOpen className="h-5 w-5 mb-1" />
                    <span>Buat Materi</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => router.push("/tutor/submissions")}
                  >
                    <CheckCircle className="h-5 w-5 mb-1" />
                    <span>Nilai Tugas</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Submissions Needing Grading */}
            <Card>
              <CardHeader>
                <CardTitle>Perlu Dinilai</CardTitle>
                <CardDescription>
                  Tugas dan kuis yang perlu dinilai
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length > 0 ? (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          router.push(`/tutor/submissions/${submission.id}`)
                        }
                      >
                        <div className="p-2 bg-amber-100 rounded-full mr-3">
                          <GraduationCap className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {submission.assignment?.title ||
                              submission.quiz?.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {submission.student?.user?.nama}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-xs text-gray-500">
                              <span>
                                {submission.assignment?.classSubjectTutor
                                  ?.subject?.namaMapel ||
                                  submission.quiz?.classSubjectTutor?.subject
                                    ?.namaMapel}{" "}
                                •
                                {submission.assignment?.classSubjectTutor?.class
                                  ?.namaKelas ||
                                  submission.quiz?.classSubjectTutor?.class
                                    ?.namaKelas}
                              </span>
                            </div>
                            <div className="text-xs">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {submission.assignmentId ? "Tugas" : "Kuis"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      Tidak ada tugas yang perlu dinilai
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/tutor/submissions")}
                >
                  Lihat Semua Pengumpulan
                </Button>
              </CardFooter>
            </Card>

            {/* Submission Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistik Pengumpulan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Dikumpulkan</span>
                      <span className="text-sm font-medium">
                        {statistics.submissions.submitted} /{" "}
                        {statistics.submissions.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        (statistics.submissions.submitted /
                          statistics.submissions.total) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Dinilai</span>
                      <span className="text-sm font-medium">
                        {statistics.submissions.graded} /{" "}
                        {statistics.submissions.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        (statistics.submissions.graded /
                          statistics.submissions.total) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Terlambat</span>
                      <span className="text-sm font-medium">
                        {statistics.submissions.late} /{" "}
                        {statistics.submissions.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        (statistics.submissions.late /
                          statistics.submissions.total) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        Nilai Rata-rata
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {statistics.submissions.averageScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
