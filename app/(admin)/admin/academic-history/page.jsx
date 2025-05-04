"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { AcademicYearFilter } from "@/components/AcademicYearFilter";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function StudentHistoryPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [naikKelasFilter, setNaikKelasFilter] = useState("");

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years");
      const list = res.data.data.academicYears || [];
      setAcademicYears(list);

      const active = list.find((y) => y.isActive);
      if (active) setSelectedAcademicYear(active.id);
    } catch {
      toast.error("Gagal memuat tahun ajaran");
    }
  };

  const fetchHistory = async () => {
    if (!selectedAcademicYear) return;
    try {
      setIsLoading(true);
      const params = {
        search: searchQuery,
        academicYearId: selectedAcademicYear,
      };
      if (naikKelasFilter !== "") {
        params.naikKelas = naikKelasFilter === "true";
      }

      const res = await api.get("/student-histories", { params });
      setData(res.data.data.histories || []);
    } catch (err) {
      toast.error("Gagal memuat riwayat siswa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedAcademicYear) fetchHistory();
  }, [searchQuery, selectedAcademicYear, naikKelasFilter]);

  const columns = [
    {
      header: "Nama Siswa",
      cell: (row) => row.student?.namaLengkap || "-",
    },
    {
      header: "Email",
      cell: (row) => row.student?.user?.email || "-",
    },
    {
      header: "Tahun Ajaran",
      cell: (row) =>
        row.academicYear
          ? `${row.academicYear.tahunMulai}/${row.academicYear.tahunSelesai}`
          : "-",
    },
    {
      header: "Kelas",
      cell: (row) => row.class?.namaKelas || "-",
    },
    {
      header: "Program",
      cell: (row) => row.class?.program?.namaPaket || "-",
    },
    {
      header: "Status",
      cell: (row) =>
        row.naikKelas ? (
          <Badge variant="success">Naik Kelas</Badge>
        ) : (
          <Badge variant="destructive">Mengulang</Badge>
        ),
    },
    {
      header: "Nilai Akhir",
      cell: (row) =>
        row.nilaiAkhir != null ? Number(row.nilaiAkhir).toFixed(2) : "-",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Riwayat Kelas Siswa"
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Riwayat Siswa" },
            ]}
          />

          <Tabs defaultValue="riwayat" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Cari siswa..."
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
                {
                  label: "Status Kenaikan",
                  content: (
                    <select
                      className="input input-sm border rounded px-2 py-1 text-sm"
                      value={naikKelasFilter}
                      onChange={(e) => setNaikKelasFilter(e.target.value)}
                    >
                      <option value="">Semua</option>
                      <option value="true">Naik Kelas</option>
                      <option value="false">Mengulang</option>
                    </select>
                  ),
                },
              ]}
            />

            <TabsContent value="riwayat" className="space-y-4">
              <DataTable
                data={Array.isArray(data) ? data : []}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data riwayat..."
                emptyMessage="Tidak ada riwayat ditemukan"
                keyExtractor={(row) => row.id}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
