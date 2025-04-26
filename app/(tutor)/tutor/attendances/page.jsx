"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";

import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatsCard } from "@/components/ui/stats-card";

import { Plus, Users, Calendar, Clock, ClipboardList, Eye } from "lucide-react";

import Link from "next/link";

export default function TutorAttendancesPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/tutor/attendances");
      setData(res.data.data || []);
    } catch (error) {
      console.error("Gagal memuat data presensi:", error);
      toast.error("Gagal memuat data presensi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter((item) =>
      item.class?.namaKelas?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const columns = [
    {
      header: "Tanggal",
      accessorKey: "tanggal",
      cell: (row) =>
        row.tanggal ? new Date(row.tanggal).toLocaleDateString("id-ID") : "-",
    },
    {
      header: "Kelas",
      accessorKey: "class.namaKelas",
      cell: (row) => row.class?.namaKelas || "-",
    },
    {
      header: "Tahun Ajaran",
      cell: (row) => {
        const ay = row.academicYear;
        return ay ? `${ay.tahunMulai}/${ay.tahunSelesai}` : "-";
      },
    },
    {
      header: "Keterangan",
      accessorKey: "keterangan",
      cell: (row) => row.keterangan || "-",
    },
    {
      header: "Aksi",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/tutor/attendances/${row.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Presensi Siswa"
        description="Kelola daftar sesi presensi untuk kelas Anda."
        actions={
          <Button asChild>
            <Link href="/tutor/attendances/create">
              <Plus className="mr-2 h-4 w-4" />
              Buat Presensi
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Presensi Siswa" },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Sesi"
          value={data.length}
          description="Total presensi yang Anda buat"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatsCard
          title="Kelas Terlibat"
          value={new Set(data.map((d) => d.class?.namaKelas)).size}
          description="Kelas yang memiliki sesi presensi"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Tahun Ajaran Aktif"
          value={
            new Set(
              data.map((d) =>
                d.academicYear
                  ? `${d.academicYear.tahunMulai}/${d.academicYear.tahunSelesai}`
                  : "-"
              )
            ).size
          }
          description="Tahun ajaran yang terlibat"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatsCard
          title="Presensi Hari Ini"
          value={
            data.filter((d) => {
              const today = new Date().toDateString();
              const presensiDate = new Date(d.tanggal).toDateString();
              return today === presensiDate;
            }).length
          }
          description="Sesi presensi hari ini"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Tabs dan Table */}
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
          </TabsList>

          <DataToolbar
            searchValue={searchQuery}
            onSearchChange={(value) => setSearchQuery(value)}
            searchPlaceholder="Cari kelas..."
            filterOptions={[]} // Kosong dulu
          />
        </div>

        <TabsContent value="all" className="space-y-4">
          {filteredData.length > 0 ? (
            <DataTable
              data={filteredData}
              columns={columns}
              isLoading={isLoading}
              loadingMessage="Memuat data presensi..."
              emptyMessage="Belum ada presensi"
              keyExtractor={(item) => item.id}
            />
          ) : (
            <EmptyState
              title="Belum ada presensi"
              description="Anda belum membuat presensi. Klik tombol 'Buat Presensi' untuk memulai."
              icon={<ClipboardList className="h-6 w-6 text-muted-foreground" />}
              action={() => router.push("/tutor/attendances/create")}
              actionLabel="Buat Presensi"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
