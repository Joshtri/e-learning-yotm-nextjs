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
import { Skeleton } from "@/components/ui/skeleton";
import SkeletonTable from "@/components/ui/skeleton/SkeletonTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StudentOtherScoresPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const fetchOtherScores = async () => {
    try {
      const res = await api.get("/student/other-scores");
      setData(res.data.data || []);
      if (res.data.filterOptions) {
        setAcademicYears(res.data.filterOptions.academicYears || []);
        setSubjects(res.data.filterOptions.subjects || []);
      }
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

  const tugasData = useMemo(() => {
    let filtered = data.filter((item) => item.tipe === "TUGAS");
    if (selectedAcademicYearId) {
      filtered = filtered.filter(
        (item) => item.academicYearId === selectedAcademicYearId
      );
    }
    if (selectedSubjectId) {
      filtered = filtered.filter((item) => item.mapelId === selectedSubjectId);
    }
    return filtered;
  }, [data, selectedAcademicYearId, selectedSubjectId]);

  const kuisData = useMemo(() => {
    let filtered = data.filter((item) => item.tipe === "KUIS");
    if (selectedAcademicYearId) {
      filtered = filtered.filter(
        (item) => item.academicYearId === selectedAcademicYearId
      );
    }
    if (selectedSubjectId) {
      filtered = filtered.filter((item) => item.mapelId === selectedSubjectId);
    }
    return filtered;
  }, [data, selectedAcademicYearId, selectedSubjectId]);

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
      cell: (row) => {
        const nilai = row.nilai;
        return nilai !== null && nilai !== undefined
          ? parseFloat(nilai).toFixed(2)
          : "-";
      },
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

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">
            Filter Tahun Ajaran
          </label>
          <Select value={selectedAcademicYearId || "all"} onValueChange={(value) => setSelectedAcademicYearId(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">
            Filter Mata Pelajaran
          </label>
          <Select value={selectedSubjectId || "all"} onValueChange={(value) => setSelectedSubjectId(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Mata Pelajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
            <>
              <SkeletonTable numRows={3} numCols={5} />
            </>
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
