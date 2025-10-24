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
import { Plus, FileText, Calendar, Clock, Filter, Edit } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import SkeletonTable from "@/components/ui/skeleton/SkeletonTable";

export default function TutorQuizPage() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const router = useRouter();

  useEffect(() => {
    if (!selectedAcademicYearId) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/tutor/quizzes", {
          params: { academicYearId: selectedAcademicYearId },
        });
        setData(res.data.data || []);
      } catch (error) {
        console.error("Gagal ambil quiz:", error);
        toast.error("Gagal memuat data kuis");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedAcademicYearId]);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await api.get("/academic-years");
        setAcademicYears(res.data.data.academicYears || []);
        const active = res.data.data.academicYears.find((y) => y.isActive);
        if (active) setSelectedAcademicYearId(active.id);
      } catch (e) {
        console.error(e);
        toast.error("Gagal memuat tahun ajaran");
      }
    };
    fetchYears();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.judul.toLowerCase().includes(q) ||
        item.classSubjectTutor.class.namaKelas.toLowerCase().includes(q) ||
        item.classSubjectTutor.subject.namaMapel.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const getQuizStatus = (quiz) => {
    // Normalisasi ke UTC untuk perbandingan yang konsisten
    const now = new Date();
    const currentTime = now.getTime();

    const startDate = new Date(quiz.waktuMulai);
    const startTime = startDate.getTime();

    const endDate = new Date(quiz.waktuSelesai);
    const endTime = endDate.getTime();

    if (startTime > currentTime) {
      return { status: "pending", label: "Akan Datang" };
    } else if (startTime <= currentTime && endTime >= currentTime) {
      return { status: "active", label: "Sedang Berlangsung" };
    } else {
      return { status: "completed", label: "Selesai" };
    }
  };

  async function handleDelete(id) {
    const ok = window.confirm(
      "Yakin ingin menghapus kuis ini? Tindakan ini tidak dapat dibatalkan."
    );
    if (!ok) return;

    try {
      setDeletingId(id);
      // Optimistik: hapus dulu di UI
      setData((prev) => prev.filter((x) => x.id !== id));

      const res = await api.delete(`/tutor/quizzes/${id}`);
      if (res.data?.success) {
        toast.success("Kuis berhasil dihapus");
        // Optional: refetch untuk sinkron (kalau perlu)
        // const ref = await api.get("/tutor/quizzes", { params: { academicYearId: selectedAcademicYearId }});
        // setData(ref.data.data || []);
      } else {
        // rollback kalau gagal
        toast.error(res.data?.message || "Gagal menghapus kuis");
        // refetch untuk rollback data
        const ref = await api.get("/tutor/quizzes", {
          params: { academicYearId: selectedAcademicYearId },
        });
        setData(ref.data.data || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus kuis");
      // rollback data
      const ref = await api.get("/tutor/quizzes", {
        params: { academicYearId: selectedAcademicYearId },
      });
      setData(ref.data.data || []);
    } finally {
      setDeletingId(null);
    }
  }

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
          <div className="text-xs text-muted-foreground mt-1">
            {row._count?.questions || 0} soal
          </div>
        </div>
      ),
    },
    {
      header: "Kelas & Mapel",
      cell: (row) => (
        <div>
          <div>{row.classSubjectTutor.class.namaKelas}</div>
          <div className="text-sm text-muted-foreground">
            {row.classSubjectTutor.subject.namaMapel}
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
        const { status, label } = getQuizStatus(row);
        return <StatusBadge status={status} label={label} />;
      },
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/tutor/quizzes/${row.id}/questions`)}
          >
            Soal
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => router.push(`/tutor/quizzes/${row.id}/questions`)}
          >
            Jawaban
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => router.push(`/tutor/quizzes/${row.id}/students`)}
          >
            Jawaban Siswa
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/tutor/quizzes/${row.id}`)}
          >
            Detail
          </Button>

          {/* ✅ Tombol Edit */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/tutor/quizzes/${row.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>

          {/* ✅ Tombol Hapus */}
          <Button
            size="sm"
            variant="destructive"
            disabled={deletingId === row.id}
            onClick={() => handleDelete(row.id)}
          >
            {deletingId === row.id ? "Menghapus..." : "Hapus"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Manajemen Kuis"
        description="Daftar kuis yang telah Anda buat"
        actions={
          <Button onClick={() => router.push("/tutor/quizzes/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kuis
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Kuis" },
        ]}
      />

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
                          {year.tahunMulai}/{year.tahunSelesai} - {year.semester}
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
          {isLoading ? (
            <SkeletonTable numCols={5} numRows={5} showHeader />
          ) : filteredData.length > 0 ? (
            <DataTable
              data={filteredData}
              columns={columns}
              isLoading={false}
              loadingMessage="Memuat kuis..."
              emptyMessage="Belum ada kuis"
              keyExtractor={(item) => item.id}
            />
          ) : (
            <EmptyState
              title="Belum ada kuis"
              description="Anda belum membuat kuis. Klik tombol 'Tambah Kuis' untuk mulai membuat kuis baru."
              icon={<FileText className="h-6 w-6 text-muted-foreground" />}
              action={() => router.push("/tutor/quizzes/create")}
              actionLabel="Tambah Kuis"
            />
          )}
        </TabsContent>

        <TabsContent value="active">
          <EmptyState
            title="Tidak ada kuis yang sedang berlangsung"
            description="Saat ini tidak ada kuis yang sedang aktif."
            icon={<Clock className="h-6 w-6 text-muted-foreground" />}
          />
        </TabsContent>

        <TabsContent value="upcoming">
          <EmptyState
            title="Tidak ada kuis yang akan datang"
            description="Anda belum menjadwalkan kuis yang akan datang."
            icon={<Calendar className="h-6 w-6 text-muted-foreground" />}
          />
        </TabsContent>

        <TabsContent value="completed">
          <EmptyState
            title="Tidak ada kuis yang telah selesai"
            description="Belum ada kuis yang telah selesai."
            icon={<FileText className="h-6 w-6 text-muted-foreground" />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
