// /app/tutor/learning-materials/page.tsx
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
  Trash2,
  Eye,
  Download,
  Upload,
  Filter,
} from "lucide-react";
import LearningMaterialAddModal from "@/components/tutors/learning-materials/LearningMaterialAddModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";

export default function TutorMaterialsPage() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalMaterials: 0,
    recentUploads: 0,
    studentViews: 0,
  });
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years?pagination=false");
      const list = res.data.data?.academicYears || [];
      const activeYear = list.find((y) => y.isActive);
      setAcademicYears(list);
      setSelectedYear(activeYear?.id || "");
    } catch (err) {
      toast.error("Gagal memuat tahun ajaran");
    }
  };

  const fetchData = async (yearId) => {
    try {
      setIsLoading(true);
      const res = await api.get("/tutor/learning-materials", {
        params: { academicYearId: yearId },
      });
      const materialsData = res.data.data || [];
      setData(materialsData);

      setStats({
        totalMaterials: materialsData.length,
        recentUploads: materialsData.filter((m) => {
          const uploadDate = new Date(m.createdAt);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return uploadDate > oneWeekAgo;
        }).length,
        studentViews: materialsData.reduce(
          (acc, curr) => acc + (curr.viewCount || 0),
          0
        ),
      });
    } catch (error) {
      console.error("Gagal ambil materi:", error);
      toast.error("Gagal memuat materi pembelajaran");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchData(selectedYear);
    }
  }, [selectedYear]);

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

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus materi ini?")) return;

    try {
      await api.delete(`/tutor/learning-materials/${id}`);
      toast.success("Materi dihapus");
      fetchData(selectedYear);
    } catch (error) {
      toast.error("Gagal menghapus materi");
    }
  };

  const getFileTypeIcon = (filename) => {
    if (!filename) return <FileText className="h-4 w-4" />;
    const ext = filename.split(".").pop().toLowerCase();
    const colors = {
      pdf: "text-red-500",
      doc: "text-blue-500",
      docx: "text-blue-500",
      xls: "text-green-500",
      xlsx: "text-green-500",
      ppt: "text-orange-500",
      pptx: "text-orange-500",
    };
    return <FileText className={`h-4 w-4 ${colors[ext] || ""}`} />;
  };

  const columns = [
    { header: "No", cell: (_, index) => index + 1, className: "w-[50px]" },
    {
      header: "Materi",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2">
            {getFileTypeIcon(row.fileName)}
          </div>
          <div>
            <div className="font-medium">{row.judul}</div>
            <div className="text-sm text-muted-foreground">
              {row.fileName || "No file attached"}
            </div>
          </div>
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
      header: "Status",
      cell: () => <StatusBadge status="active" label="Dipublikasikan" />, // update logic here if needed
    },
    {
      header: "Dibuat",
      cell: (row) => (
        <div className="text-sm">
          <div>{new Date(row.createdAt).toLocaleDateString("id-ID")}</div>
          <div className="text-muted-foreground">
            {new Date(row.createdAt).toLocaleTimeString("id-ID")}
          </div>
        </div>
      ),
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Materi Pembelajaran"
        description="Daftar materi yang telah Anda unggah."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Materi
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Materi Pembelajaran" },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Materi"
          value={stats.totalMaterials}
          description="Materi yang telah Anda unggah"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Unggahan Baru"
          value={stats.recentUploads}
          description="Dalam 7 hari terakhir"
          icon={<Upload className="h-4 w-4" />}
          trend="up"
          trendValue={`${stats.recentUploads} baru`}
        />
        <StatsCard
          title="Dilihat Siswa"
          value={stats.studentViews}
          description="Total view dari siswa"
          icon={<Eye className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue="all" className="space-y-5">
        <TabsList>
          <TabsTrigger value="all">Semua Materi</TabsTrigger>
          <TabsTrigger value="documents">Dokumen</TabsTrigger>
          <TabsTrigger value="videos">Video</TabsTrigger>
        </TabsList>

        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari judul, kelas, mapel..."
          filterOptions={[
            {
              label: "Tahun Ajaran",
              icon: <Filter className="h-4 w-4" />,
              content: (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.tahunMulai}/{year.tahunSelesai}{" "}
                      {year.isActive ? "(Aktif)" : ""}
                    </option>
                  ))}
                </select>
              ),
            },
          ]}
        />

        <TabsContent value="all">
          <DataTable
            data={filteredData}
            columns={columns}
            isLoading={isLoading}
            loadingMessage="Memuat materi..."
            emptyMessage="Belum ada materi"
            keyExtractor={(item) => item.id}
          />
        </TabsContent>
      </Tabs>

      <LearningMaterialAddModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchData(selectedYear)}
      />
    </div>
  );
}
