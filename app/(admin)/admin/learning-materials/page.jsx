"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataExport } from "@/components/ui/data-export";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";

export default function LearningMaterialPage() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/learning-materials");
      setData(res.data.data || []);
    } catch (error) {
      console.error("Gagal memuat data:", error);
      toast.error("Gagal memuat materi");
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
        item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.classSubjectTutor.class.namaKelas
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.classSubjectTutor.subject.namaMapel
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.classSubjectTutor.tutor.namaLengkap
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Judul",
      cell: (row) => row.judul,
    },
    {
      header: "Kelas",
      cell: (row) => row.classSubjectTutor?.class?.namaKelas || "-",
    },
    {
      header: "Mapel",
      cell: (row) => row.classSubjectTutor?.subject?.namaMapel || "-",
    },
    {
      header: "Tutor",
      cell: (row) => row.classSubjectTutor?.tutor?.namaLengkap || "-",
    },
    {
      header: "File / URL",
      cell: (row) =>
        row.fileUrl ? (
          <a
            href={row.fileUrl}
            target="_blank"
            className="text-blue-600 underline"
          >
            Lihat File
          </a>
        ) : (
          "-"
        ),
    },
    {
      header: "Dibuat",
      cell: (row) => new Date(row.createdAt).toLocaleDateString("id-ID"),
    },

    {
      header: "Aksi",
      cell: (row) => (
        <Link href={`/admin/learning-materials/${row.id}`}>
          <Button variant="outline" size="sm">
            Lihat
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Materi Pembelajaran"
            description="Daftar semua materi yang dibuat oleh tutor"
            actions={
              <DataExport data={data} filename="materi.csv" label="Export" />
            }
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Materi Pembelajaran" },
            ]}
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => setSearchQuery(value)}
              searchPlaceholder="Cari judul, kelas, mapel, atau tutor..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredData}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data materi..."
                emptyMessage="Tidak ada materi ditemukan"
                keyExtractor={(item) => item.id}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
