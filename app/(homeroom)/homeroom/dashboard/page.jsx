"use client";

import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { CalendarCheck, Users, BarChart3, NotebookPen } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeroomDashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAttendances: 0,
    totalAssignments: 0,
    averageScore: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchHomeroomDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/homeroom/dashboard");
      setStats(res.data.data);
    } catch (error) {
      console.error("Gagal memuat dashboard wali kelas:", error);
      toast.error("Gagal memuat data dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeroomDashboard();
  }, []);

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

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard Wali Kelas"
        description="Pantau presensi dan prestasi siswa di kelas Anda."
        breadcrumbs={[{ label: "Dashboard", href: "/homeroom/dashboard" }]}
      />

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
              title="Jumlah Siswa"
              value={stats.totalStudents}
              description="Total siswa di kelas Anda"
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="Jumlah Presensi"
              value={stats.totalAttendances}
              description="Jumlah kehadiran siswa"
              icon={<CalendarCheck className="h-4 w-4" />}
            />
            <StatsCard
              title="Jumlah Tugas"
              value={stats.totalAssignments}
              description="Tugas yang diberikan"
              icon={<NotebookPen className="h-4 w-4" />}
            />
            <StatsCard
              title="Rata-rata Nilai"
              value={`${stats.averageScore}%`}
              description="Rata-rata nilai akademik"
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </>
        )}
      </div>
    </div>
  );
}
