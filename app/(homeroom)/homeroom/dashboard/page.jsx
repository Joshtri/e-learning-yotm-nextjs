"use client";

import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { CalendarCheck, Users, BarChart3, NotebookPen, ArrowRight, GraduationCap } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useHomeroomDashboard } from "@/hooks/useDashboardQueries";

export default function HomeroomDashboardPage() {
  const router = useRouter();
  const {
    overview,
    classes,
    stats: dashboardStats,
    students,
    isLoading,
    error,
  } = useHomeroomDashboard();

  const stats = {
    totalStudents: overview?.totalStudents || 0,
    totalAttendances: overview?.totalAttendances || 0,
    totalAssignments: overview?.totalAssignments || 0,
    averageScore: overview?.averageScore || 0,
    totalFinalScores: overview?.totalFinalScores || 0,
    classInfo: overview?.classInfo || null,
  };

  // Skeleton cards to show while loading
  const renderSkeletonCard = () => (
    <div className="bg-card border rounded-lg p-4 shadow-sm">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );

  const classInfo = stats.classInfo;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard Wali Kelas"
        description={
          !isLoading && classInfo
            ? `Anda adalah wali kelas ${classInfo.namaKelas} (${classInfo.program || "Program"}) - Tahun Ajaran ${classInfo.academicYear.tahunMulai}/${classInfo.academicYear.tahunSelesai} Semester ${classInfo.academicYear.semester}`
            : "Memuat informasi kelas..."
        }
        breadcrumbs={[{ label: "Dashboard", href: "/homeroom/dashboard" }]}
      />

      {/* Info Kelas & Tahun Ajaran */}
      {!isLoading && classInfo && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Informasi Kelas yang Anda Kelola
            </CardTitle>
            <CardDescription className="text-blue-700 font-medium">
              Data kelas dan tahun akademik yang sedang berjalan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Kelas
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {classInfo.namaKelas}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  Program
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {classInfo.program || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <CalendarCheck className="h-3 w-3" />
                  Tahun Ajaran
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {classInfo.academicYear.tahunMulai}/
                  {classInfo.academicYear.tahunSelesai}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semester & Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-3 py-1 rounded-md text-sm font-semibold ${
                      classInfo.academicYear.semester === "GENAP"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {classInfo.academicYear.semester}
                  </span>
                  {classInfo.academicYear.isActive ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                      ✓ Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold">
                      ⏳ Belum Aktif
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {renderSkeletonCard()}
            {renderSkeletonCard()}
            {renderSkeletonCard()}
            {renderSkeletonCard()}
          </>
        ) : (
          <>
            <StatsCard
              title="Jumlah Siswa Aktif"
              value={stats.totalStudents}
              description="Total siswa aktif di kelas"
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="Total Presensi"
              value={stats.totalAttendances}
              description="Rekap kehadiran tahun ajaran ini"
              icon={<CalendarCheck className="h-4 w-4" />}
            />
            <StatsCard
              title="Total Tugas"
              value={stats.totalAssignments}
              description="Tugas di kelas ini"
              icon={<NotebookPen className="h-4 w-4" />}
            />
            <StatsCard
              title="Rata-rata Nilai Akhir"
              value={stats.averageScore}
              description={
                stats.totalFinalScores > 0
                  ? `Dari ${stats.totalFinalScores} nilai akhir siswa`
                  : "Belum ada nilai akhir"
              }
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      {!isLoading && classInfo && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classInfo.academicYear.semester === "GANJIL" ? (
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/homeroom/move-semester")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                    Pindah ke Semester Baru
                  </CardTitle>
                  <CardDescription>
                    Pindahkan siswa ke tahun akademik atau semester berikutnya
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Pindahkan Siswa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/homeroom/promote-students")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Manajemen Naik Kelas
                  </CardTitle>
                  <CardDescription>
                    Kelola proses kenaikan kelas untuk siswa di semester ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Kelola Naik Kelas
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tambahkan quick actions lain di sini jika perlu */}
          </div>
        </div>
      )}
    </div>
  );
}
