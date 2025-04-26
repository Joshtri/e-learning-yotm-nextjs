// app/(student)/other-scores/page.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { CalendarCheck, FileText, BookOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function StudentOtherScoresPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOtherScores = async () => {
    try {
      const res = await api.get("/student/other-scores");
      setData(res.data.data || []);
    } catch (error) {
      console.error("Gagal memuat other scores:", error);
      toast.error("Gagal memuat nilai tugas dan kuis");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOtherScores();
  }, []);

  const tugasData = useMemo(
    () => data.filter((item) => item.tipe === "TUGAS"),
    [data]
  );

  const kuisData = useMemo(
    () => data.filter((item) => item.tipe === "KUIS"),
    [data]
  );

  const columns = [
    {
      header: "Judul",
      accessorKey: "judul",
      cell: (row) => row.judul || "-",
    },
    {
      header: "Kelas",
      accessorKey: "kelas",
      cell: (row) => row.kelas || "-",
    },
    {
      header: "Mata Pelajaran",
      accessorKey: "mapel",
      cell: (row) => row.mapel || "-",
    },
    {
      header: "Nilai",
      accessorKey: "nilai",
      cell: (row) => (row.nilai !== null ? `${row.nilai}` : "-"),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => {
        if (row.status === "GRADED") {
          return (
            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Dinilai
            </span>
          );
        }
        return (
          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400">
            {row.status}
          </span>
        );
      },
    },
    {
      header: "Waktu Kumpul",
      accessorKey: "waktuKumpul",
      cell: (row) =>
        row.waktuKumpul
          ? new Date(row.waktuKumpul).toLocaleDateString("id-ID")
          : "-",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Nilai Tugas & Kuis"
        description="Lihat rekap nilai tugas dan kuis Anda."
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Other Scores" },
        ]}
        icon={<BookOpen className="h-6 w-6" />}
      />

      <Tabs defaultValue="tugas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tugas">Tugas</TabsTrigger>
          <TabsTrigger value="kuis">Kuis</TabsTrigger>
        </TabsList>

        {/* Tab Tugas */}
        <TabsContent value="tugas">
          {tugasData.length > 0 ? (
            <DataTable
              data={tugasData}
              columns={columns}
              isLoading={isLoading}
              loadingMessage="Memuat nilai tugas..."
              emptyMessage="Belum ada nilai tugas."
              keyExtractor={(item) => item.id}
            />
          ) : (
            <EmptyState
              title="Belum ada tugas"
              description="Belum ada nilai tugas yang tersedia."
              icon={<FileText className="h-6 w-6 text-muted-foreground" />}
            />
          )}
        </TabsContent>

        {/* Tab Kuis */}
        <TabsContent value="kuis">
          {kuisData.length > 0 ? (
            <DataTable
              data={kuisData}
              columns={columns}
              isLoading={isLoading}
              loadingMessage="Memuat nilai kuis..."
              emptyMessage="Belum ada nilai kuis."
              keyExtractor={(item) => item.id}
            />
          ) : (
            <EmptyState
              title="Belum ada kuis"
              description="Belum ada nilai kuis yang tersedia."
              icon={<CalendarCheck className="h-6 w-6 text-muted-foreground" />}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
