"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFViewerButton } from "@/components/ui/pdf-viewer";
import api from "@/lib/axios";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteAssignmentById } from "@/services/TutorAssignment";

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

  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);

  useEffect(() => {
    const fetchAcademicYears = async () => {
      const res = await api.get("/academic-years");
      setAcademicYears(res.data.data.academicYears);
      const active = res.data.data.academicYears.find((y) => y.isActive);
      if (active) setSelectedAcademicYearId(active.id); // default aktif
    };
    fetchAcademicYears();
  }, []);

  const router = useRouter();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/tutor/assignments", {
        params: {
          academicYearId: selectedAcademicYearId,
        },
      });
      const assignmentsData = res.data.data || [];
      setData(assignmentsData);

      // Calculate stats
      const now = new Date();
      const activeAssignments = assignmentsData.filter((assignment) => {
        const startDate = new Date(assignment.TanggalMulai || assignment.waktuMulai);
        const endDate = new Date(assignment.TanggalSelesai || assignment.waktuSelesai);
        return startDate <= now && endDate >= now;
      });

      // This would be replaced with actual API data in production
      const pendingReview = Math.floor(Math.random() * 10);

      const completedAssignments = assignmentsData.filter((assignment) => {
        const endDate = new Date(assignment.TanggalSelesai || assignment.waktuSelesai);
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

  const getAssignmentStatus = (assignment) => {
    const now = new Date();
    const startDate = new Date(assignment.TanggalMulai || assignment.waktuMulai);
    const endDate = new Date(assignment.TanggalSelesai || assignment.waktuSelesai);

    if (startDate > now) {
      return { status: "pending", label: "Akan Datang" };
    } else if (startDate <= now && endDate >= now) {
      return { status: "active", label: "Sedang Berlangsung" };
    } else {
      return { status: "completed", label: "Selesai" };
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAssignmentById(id);
      toast.success("Tugas berhasil dihapus");
      fetchData(); // Refresh daftar tugas
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Gagal menghapus tugas. Coba lagi nanti.";
      toast.error(message);
      console.error("Gagal hapus tugas:", error);
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
      header: "Jumlah Soal",
      cell: (row) => (
        <span className="text-sm font-medium">
          {row._count?.questions ?? 0} soal
        </span>
      ),
      className: "",
    },

    {
      header: "Tanggal Mulai",
      cell: (row) => (
        <div className="flex items-center text-sm">
          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
          <span>
            {new Date(row.TanggalMulai || row.waktuMulai).toLocaleDateString("id-ID", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      ),
    },
    {
      header: "Tanggal Selesai",
      cell: (row) => (
        <div className="flex items-center text-sm">
          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
          <span>
            {new Date(row.TanggalSelesai || row.waktuSelesai).toLocaleDateString("id-ID", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
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
          {row.questionsFromPdf ? (
            <PDFViewerButton
              pdfData={row.questionsFromPdf}
              title={`Soal - ${row.judul}`}
              downloadFileName={`Soal_${row.judul}.pdf`}
            />
          ) : (
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
          )}

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

          {/* ✅ Tombol Hapus */}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (
                window.confirm(
                  "Yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan."
                )
              ) {
                handleDelete(row.id);
              }
            }}
          >
            Hapus
          </Button>
        </div>
      ),
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    label: "Tahun Ajaran",
                    icon: <Filter className="h-4 w-4" />,
                    content: (
                      <div className="p-2">
                        <p className="text-sm font-medium mb-2">
                          Pilih Tahun Ajaran
                        </p>
                        <select
                          value={selectedAcademicYearId || ""}
                          onChange={(e) =>
                            setSelectedAcademicYearId(e.target.value)
                          }
                          className="w-full border rounded-md px-2 py-1 text-sm"
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
      </div>
    </div>
  );
}
