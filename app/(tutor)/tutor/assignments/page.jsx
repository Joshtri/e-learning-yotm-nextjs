"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Eye,
  Calendar,
  Clock,
  Filter,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

export default function TutorAssignmentPage() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    activeAssignments: 0,
    pendingReview: 0,
    completedAssignments: 0,
  });

  const router = useRouter();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/tutor/assignments");
      const assignmentsData = res.data.data || [];
      setData(assignmentsData);

      // Calculate stats
      const now = new Date();
      const activeAssignments = assignmentsData.filter((assignment) => {
        const startDate = new Date(assignment.waktuMulai);
        const endDate = new Date(assignment.waktuSelesai);
        return startDate <= now && endDate >= now;
      });

      // This would be replaced with actual API data in production
      const pendingReview = Math.floor(Math.random() * 10);

      const completedAssignments = assignmentsData.filter((assignment) => {
        const endDate = new Date(assignment.waktuSelesai);
        return endDate < now;
      });

      setStats({
        totalAssignments: assignmentsData.length,
        activeAssignments: activeAssignments.length,
        pendingReview: pendingReview,
        completedAssignments: completedAssignments.length,
      });
    } catch (error) {
      console.error("Gagal ambil tugas:", error);
      toast.error("Gagal memuat data tugas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const getAssignmentStatus = (assignment) => {
    const now = new Date();
    const startDate = new Date(assignment.waktuMulai);
    const endDate = new Date(assignment.waktuSelesai);

    if (startDate > now) {
      return { status: "pending", label: "Akan Datang" };
    } else if (startDate <= now && endDate >= now) {
      return { status: "active", label: "Sedang Berlangsung" };
    } else {
      return { status: "completed", label: "Selesai" };
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
            {row.jenis.replace("_", " ")}
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
      header: "Waktu",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
            <span>
              {new Date(row.waktuMulai).toLocaleDateString("id-ID")} -{" "}
              {new Date(row.waktuSelesai).toLocaleDateString("id-ID")}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
            <span>
              {new Date(row.waktuMulai).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -{" "}
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
        const { status, label } = getAssignmentStatus(row);
        return <StatusBadge status={status} label={label} />;
      },
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              router.push(`/tutor/assignments/${row.id}/questions/list`)
            }
          >
            <Eye className="h-4 w-4 mr-1" />
            Soal
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() =>
              router.push(`/tutor/assignments/${row.id}/submissions`)
            }
          >
            <FileText className="h-4 w-4 mr-1" />
            Periksa Jawaban
          </Button>
        </div>
      ),
    },
  ];

  const pendingSubmissions = [
    {
      id: 1,
      title: "Tugas Matematika Bab 3",
      student: "Budi Santoso",
      class: "Kelas 12A",
      submittedAt: "2 jam yang lalu",
    },
    {
      id: 2,
      title: "Tugas Fisika Bab 2",
      student: "Ani Wijaya",
      class: "Kelas 11B",
      submittedAt: "5 jam yang lalu",
    },
    {
      id: 3,
      title: "Tugas Kimia Praktikum",
      student: "Deni Pratama",
      class: "Kelas 12A",
      submittedAt: "1 hari yang lalu",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Manajemen Tugas"
        description="Daftar tugas yang telah Anda buat"
        actions={
          <Button onClick={() => router.push("/tutor/assignments/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tugas
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Tugas" },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Tugas"
          value={stats.totalAssignments}
          description="Tugas yang telah dibuat"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Sedang Berlangsung"
          value={stats.activeAssignments}
          description="Tugas yang sedang aktif"
          icon={<Clock className="h-4 w-4" />}
          trend={stats.activeAssignments > 0 ? "up" : undefined}
          trendValue={stats.activeAssignments > 0 ? "Aktif" : undefined}
        />
        <StatsCard
          title="Menunggu Penilaian"
          value={stats.pendingReview}
          description="Tugas yang perlu dinilai"
          icon={<AlertCircle className="h-4 w-4" />}
          trend={stats.pendingReview > 0 ? "up" : undefined}
          trendValue={stats.pendingReview > 0 ? "Perlu ditinjau" : undefined}
        />
        <StatsCard
          title="Selesai"
          value={stats.completedAssignments}
          description="Tugas yang telah berakhir"
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="all" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList>
                <TabsTrigger value="all">Semua</TabsTrigger>
                <TabsTrigger value="active">Berlangsung</TabsTrigger>
                <TabsTrigger value="upcoming">Akan Datang</TabsTrigger>
                <TabsTrigger value="completed">Selesai</TabsTrigger>
              </TabsList>

              <DataToolbar
                searchValue={searchQuery}
                onSearchChange={(value) => setSearchQuery(value)}
                searchPlaceholder="Cari judul, kelas, atau mapel..."
                filterOptions={[
                  {
                    label: "Filter",
                    icon: <Filter className="h-4 w-4" />,
                    // content: (
                    //   <div className="p-2">
                    //     <p className="text-sm font-medium mb-2">Jenis Tugas</p>
                    //     <div className="space-y-2">
                    //       <div className="flex items-center">
                    //         <input
                    //           type="checkbox"
                    //           id="type-individu"
                    //           className="mr-2"
                    //         />
                    //         <label htmlFor="type-individu" className="text-sm">
                    //           Individu
                    //         </label>
                    //       </div>
                    //       <div className="flex items-center">
                    //         <input
                    //           type="checkbox"
                    //           id="type-kelompok"
                    //           className="mr-2"
                    //         />
                    //         <label htmlFor="type-kelompok" className="text-sm">
                    //           Kelompok
                    //         </label>
                    //       </div>
                    //     </div>
                    //   </div>
                    // ),
                  },
                ]}
              />
            </div>

            <TabsContent value="all" className="space-y-4">
              {filteredData.length > 0 ? (
                <DataTable
                  data={filteredData}
                  columns={columns}
                  isLoading={isLoading}
                  loadingMessage="Memuat tugas..."
                  emptyMessage="Belum ada tugas"
                  keyExtractor={(item) => item.id}
                />
              ) : (
                <EmptyState
                  title="Belum ada tugas"
                  description="Anda belum membuat tugas. Klik tombol 'Tambah Tugas' untuk mulai membuat tugas baru."
                  icon={<FileText className="h-6 w-6 text-muted-foreground" />}
                  action={() => router.push("/tutor/assignments/create")}
                  actionLabel="Tambah Tugas"
                />
              )}
            </TabsContent>

            <TabsContent value="active">
              <EmptyState
                title="Tidak ada tugas yang sedang berlangsung"
                description="Saat ini tidak ada tugas yang sedang aktif."
                icon={<Clock className="h-6 w-6 text-muted-foreground" />}
              />
            </TabsContent>

            <TabsContent value="upcoming">
              <EmptyState
                title="Tidak ada tugas yang akan datang"
                description="Anda belum menjadwalkan tugas yang akan datang."
                icon={<Calendar className="h-6 w-6 text-muted-foreground" />}
              />
            </TabsContent>

            <TabsContent value="completed">
              <EmptyState
                title="Tidak ada tugas yang telah selesai"
                description="Belum ada tugas yang telah selesai."
                icon={<CheckCircle className="h-6 w-6 text-muted-foreground" />}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menunggu Penilaian</CardTitle>
              <CardDescription>Tugas yang perlu dinilai</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingSubmissions.map((submission, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg border"
                >
                  <div className="rounded-full p-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{submission.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {submission.student} - {submission.class}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {submission.submittedAt}
                      </p>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        Nilai
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => router.push("/tutor/submissions")}
              >
                Lihat Semua Pengumpulan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progres Pengumpulan</CardTitle>
              <CardDescription>Progres pengumpulan tugas aktif</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">
                      Tugas Matematika Bab 3
                    </p>
                    <p className="text-sm">75%</p>
                  </div>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    30/40 siswa telah mengumpulkan
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Tugas Fisika Bab 2</p>
                    <p className="text-sm">50%</p>
                  </div>
                  <Progress value={50} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    20/40 siswa telah mengumpulkan
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Tugas Kimia Praktikum</p>
                    <p className="text-sm">90%</p>
                  </div>
                  <Progress value={90} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    36/40 siswa telah mengumpulkan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
