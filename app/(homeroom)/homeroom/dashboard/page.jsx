"use client";

import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { CalendarCheck, Users, BarChart3, NotebookPen } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function HomeroomDashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAttendances: 0,
    totalAssignments: 0,
    averageScore: 0,
  });

  const fetchHomeroomDashboard = async () => {
    try {
      const res = await api.get("/homeroom/dashboard");
      setStats(res.data.data);
    } catch (error) {
      console.error("Gagal memuat dashboard wali kelas:", error);
      toast.error("Gagal memuat data dashboard.");
    }
  };

  useEffect(() => {
    fetchHomeroomDashboard();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard Wali Kelas"
        description="Pantau presensi dan prestasi siswa di kelas Anda."
        breadcrumbs={[{ label: "Dashboard", href: "/homeroom/dashboard" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>
    </div>
  );
}
