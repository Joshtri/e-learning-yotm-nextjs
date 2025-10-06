"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataToolbar } from "@/components/ui/data-toolbar";
import {
  FileText,
  MessageSquare,
  Users,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AcademicYearFilter } from "@/components/AcademicYearFilter";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSpinner } from "@/components/ui/loading/loading-spinner";

export default function MyClassesPage() {
  const [data, setData] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years");
      const years = res.data.data.academicYears || [];

      setAcademicYears(years);

      // Pilih tahun ajaran yang aktif sebagai default
      const activeYear = years.find((year) => year.isActive);
      if (activeYear && !selectedAcademicYear) {
        setSelectedAcademicYear(activeYear.id);
      }
    } catch (error) {
      console.error("Gagal mengambil data tahun ajaran:", error);
      toast.error("Gagal memuat tahun ajaran");
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Add academicYearId to the request if selected
      const params = new URLSearchParams();
      if (selectedAcademicYear) {
        params.append("academicYearId", selectedAcademicYear);
      }

      const res = await api.get(`/tutor/my-classes?${params.toString()}`);
      setData(res.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data kelas tutor:", error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedAcademicYear]);

  // Filter data based on selected academic year and search query
  const filteredData = useMemo(() => {
    let filtered = data;

    // Filter by academic year
    if (selectedAcademicYear) {
      filtered = filtered.filter(
        (item) => item.class?.academicYear?.id === selectedAcademicYear
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.class?.namaKelas
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.subject?.namaMapel
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.class?.program?.namaPaket
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [data, selectedAcademicYear, searchQuery]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Kelas",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.class?.namaKelas || "-"}</div>
          <div className="text-sm text-muted-foreground">
            {row.subject?.namaMapel || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Program",
      cell: (row) => row.class?.program?.namaPaket || "-",
    },
    {
      header: "Wali Kelas", // ✅ tambahan baru
      cell: (row) => row.class?.homeroomTeacher?.namaLengkap || "-",
    },
    {
      header: "Tahun Akademik",
      cell: (row) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{`${row.class?.academicYear?.tahunMulai || "-"}/${
            row.class?.academicYear?.tahunSelesai || "-"
          } - ${row.class?.academicYear?.semester || ""}`}</span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => {
        const isActive = true; // Replace with actual logic
        return (
          <StatusBadge
            status={isActive ? "active" : "completed"}
            label={isActive ? "Aktif" : "Selesai"}
          />
        );
      },
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/tutor/my-classes/${row.id}/students`)}
          >
            <Users className="h-4 w-4 mr-1" />
            Siswa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/tutor/my-classes/${row.id}/materials`)}
          >
            <FileText className="h-4 w-4 mr-1" />
            Materi
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              router.push(`/tutor/my-classes/${row.id}/discussions`)
            }
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Diskusi
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/tutor/my-classes/${row.id}/detail`)}
          >
            Detail
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Kelas yang Saya Ajar"
        description="Daftar kelas dan mata pelajaran yang Anda ajar saat ini."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor" },
          { label: "Kelas" },
        ]}
      />

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* <TabsList>
            <TabsTrigger value="all">Semua Kelas</TabsTrigger>
            <TabsTrigger value="active">Aktif</TabsTrigger>
            <TabsTrigger value="completed">Selesai</TabsTrigger>
          </TabsList> */}

          <DataToolbar
            searchValue={searchQuery}
            onSearchChange={(value) => setSearchQuery(value)}
            searchPlaceholder="Cari kelas, mapel, program..."
            filterOptions={[
              {
                label: "Tahun Ajaran",
                content: (
                  <AcademicYearFilter
                    academicYears={academicYears}
                    selectedId={selectedAcademicYear}
                    onChange={(val) => setSelectedAcademicYear(val)}
                  />
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
              loadingMessage="Memuat data kelas..."
              emptyMessage="Tidak ada kelas ditemukan"
              keyExtractor={(item) => item.id}
            />
          ) : (
            <LoadingSpinner />
            // <EmptyState
            //   title="Belum ada kelas"
            //   description="Anda belum memiliki kelas yang diajar pada tahun ajaran ini."
            //   icon={<Users className="h-6 w-6 text-muted-foreground" />}
            // />
          )}
        </TabsContent>

        <TabsContent value="active">
          <EmptyState
            title="Belum ada kelas aktif"
            description="Anda belum memiliki kelas aktif pada tahun ajaran ini."
            icon={<Users className="h-6 w-6 text-muted-foreground" />}
          />
        </TabsContent>

        <TabsContent value="completed">
          <EmptyState
            title="Belum ada kelas selesai"
            description="Anda belum memiliki kelas yang telah selesai pada tahun ajaran ini."
            icon={<Users className="h-6 w-6 text-muted-foreground" />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
