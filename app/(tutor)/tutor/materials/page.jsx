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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/tutor/learning-materials");
      const materialsData = res.data.data || [];
      setData(materialsData);

      // Calculate stats
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

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus materi ini?")) return;

    try {
      await api.delete(`/tutor/learning-materials/${id}`);
      toast.success("Materi dihapus");
      fetchData(); // refresh list
    } catch (error) {
      toast.error("Gagal menghapus materi");
    }
  };

  const getFileTypeIcon = (filename) => {
    if (!filename) return <FileText className="h-4 w-4" />;

    const extension = filename.split(".").pop().toLowerCase();

    if (["pdf"].includes(extension)) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (["doc", "docx"].includes(extension)) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (["xls", "xlsx"].includes(extension)) {
      return <FileText className="h-4 w-4 text-green-500" />;
    } else if (["ppt", "pptx"].includes(extension)) {
      return <FileText className="h-4 w-4 text-orange-500" />;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
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
      cell: (row) => {
        const isPublished = true; // Replace with actual logic
        return (
          <StatusBadge
            status={isPublished ? "active" : "pending"}
            label={isPublished ? "Dipublikasikan" : "Draft"}
          />
        );
      },
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
            <span className="sr-only">View</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  const recentMaterials = data.slice(0, 3);

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

      {/* Stats Cards */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="all" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList>
                <TabsTrigger value="all">Semua Materi</TabsTrigger>
                <TabsTrigger value="documents">Dokumen</TabsTrigger>
                <TabsTrigger value="videos">Video</TabsTrigger>
              </TabsList>

              <DataToolbar
                searchValue={searchQuery}
                onSearchChange={(value) => setSearchQuery(value)}
                searchPlaceholder="Cari judul, kelas, mapel..."
                filterOptions={[
                  {
                    label: "Filter",
                    icon: <Filter className="h-4 w-4" />,
                    content: (
                      <div className="p-2">
                        <p className="text-sm font-medium mb-2">Jenis Materi</p>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="type-document"
                              className="mr-2"
                            />
                            <label htmlFor="type-document" className="text-sm">
                              Dokumen
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="type-video"
                              className="mr-2"
                            />
                            <label htmlFor="type-video" className="text-sm">
                              Video
                            </label>
                          </div>
                        </div>
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
                  loadingMessage="Memuat materi..."
                  emptyMessage="Belum ada materi"
                  keyExtractor={(item) => item.id}
                />
              ) : (
                <EmptyState
                  title="Belum ada materi"
                  description="Anda belum mengunggah materi pembelajaran. Klik tombol 'Tambah Materi' untuk mulai mengunggah."
                  icon={<FileText className="h-6 w-6 text-muted-foreground" />}
                  action={() => setIsModalOpen(true)}
                  actionLabel="Tambah Materi"
                />
              )}
            </TabsContent>

            <TabsContent value="documents">
              <EmptyState
                title="Belum ada dokumen"
                description="Anda belum mengunggah dokumen pembelajaran."
                icon={<FileText className="h-6 w-6 text-muted-foreground" />}
              />
            </TabsContent>

            <TabsContent value="videos">
              <EmptyState
                title="Belum ada video"
                description="Anda belum mengunggah video pembelajaran."
                icon={<FileText className="h-6 w-6 text-muted-foreground" />}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Materi Terbaru</CardTitle>
              <CardDescription>Materi yang baru diunggah</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentMaterials.length > 0 ? (
                recentMaterials.map((material, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg border"
                  >
                    <div className="rounded-md bg-muted p-2">
                      {getFileTypeIcon(material.fileName)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{material.judul}</p>
                      <p className="text-xs text-muted-foreground">
                        {material.classSubjectTutor?.class?.namaKelas} -{" "}
                        {material.classSubjectTutor?.subject?.namaMapel}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(material.createdAt).toLocaleDateString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    Belum ada materi
                  </p>
                </div>
              )}

              {recentMaterials.length > 0 && (
                <Button variant="outline" className="w-full" size="sm">
                  Lihat Semua Materi
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <LearningMaterialAddModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
