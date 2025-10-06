"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DataToolbar } from "@/components/ui/data-toolbar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function StudentExamsPage() {
  const [data, setData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [examRes, subjectRes, yearRes] = await Promise.all([
        api.get("/student/exams", { params: { academicYearId: selectedYear === "all" ? undefined : selectedYear, semester: selectedSemester === "all" ? undefined : selectedSemester } }),
        api.get("/subjects"),
        api.get("/academic-years"),
      ]);
      setData(examRes.data.data);
      setSubjects(subjectRes.data.data);
      setAcademicYears(yearRes.data.data.academicYears);
    } catch (err) {
      toast.error("Gagal memuat data ujian atau filter");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    if (academicYears.length > 0 && selectedYear === "all") {
      const activeYear = academicYears.find(ay => ay.isActive);
      if (activeYear) {
        setSelectedYear(activeYear.id);
      } else {
        const latestYear = academicYears[0];
        setSelectedYear(latestYear.id);
      }
    }
  }, [academicYears, selectedYear]);

  const filteredData = data.filter((item) => {
    const matchSearch =
      item.judul.toLowerCase().includes(search.toLowerCase()) ||
      item.subject?.namaMapel.toLowerCase().includes(search.toLowerCase());

    const matchSubject =
      selectedSubject === "all" || item.subject?.id === selectedSubject;

    const matchYear =
      selectedYear === "all" || item.class?.academicYearId === selectedYear;

    const matchType =
      selectedType === "all" ||
      item.jenis?.toLowerCase() === selectedType.toLowerCase();

    return matchSearch && matchSubject && matchYear && matchType;
  });

  const columns = [
    { header: "Judul", cell: (row) => row.judul },
    {
      header: "Jenis Ujian",
      cell: (row) => (
        <div className="flex flex-col">
          <Badge
            variant={row.jenis === "MIDTERM" ? "secondary" : "destructive"}
          >
            {row.jenis}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {row.jenisDeskripsi}
          </span>
        </div>
      ),
    },
    { header: "Mata Pelajaran", cell: (row) => row.subject?.namaMapel || "-" },
    {
      header: "Tahun Ajaran",
      cell: (row) => row.class?.academicYear?.tahunMulai || "-",
    },
    { header: "Tutor", cell: (row) => row.tutor?.namaLengkap || "-" },
    {
      header: "Waktu",
      cell: (row) =>
        `${new Date(row.waktuMulai).toLocaleString("id-ID")} - ${new Date(
          row.waktuSelesai
        ).toLocaleString("id-ID")}`,
    },
    {
      header: "Status",
      cell: (row) => {
        const now = new Date();
        if (row.sudahDikerjakan) return "Selesai";
        if (
          now >= new Date(row.waktuMulai) &&
          now <= new Date(row.waktuSelesai)
        )
          return "Sedang Dikerjakan";
        return "Belum Dikerjakan";
      },
    },
    {
      header: "Aksi",
      cell: (row) => {
        const now = new Date();
        const mulai = new Date(row.waktuMulai);
        const selesai = new Date(row.waktuSelesai);
        const sudahDikerjakan = row.sudahDikerjakan;

        if (sudahDikerjakan) {
          return <span className="text-green-600">✅ Selesai</span>;
        }

        if (now >= mulai && now <= selesai) {
          return (
            <a
              href={`/siswa/exams/${row.id}/start`}
              className="text-sm text-blue-600 underline hover:text-blue-800"
            >
              Kerjakan
            </a>
          );
        }

        return <span className="text-muted-foreground">Belum tersedia</span>;
      },
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6 space-y-4">
          <PageHeader
            title="Ujian Anda"
            description="Daftar ujian (UTS dan UAS) yang tersedia untuk dikerjakan"
            breadcrumbs={[
              { label: "Dashboard", href: "/siswa/dashboard" },
              { label: "Ujian" },
            ]} // Add breadcrumbs here
          />

          <Tabs defaultValue="all">
            <DataToolbar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari judul atau mapel..."
            />

            {/* Filter Section */}
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <Select
                  value={selectedSubject}
                  onValueChange={(val) => setSelectedSubject(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Mapel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Mapel</SelectItem>
                    {Array.isArray(subjects) &&
                      subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.namaMapel}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Select
                  value={selectedYear}
                  onValueChange={(val) => setSelectedYear(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tahun Ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun</SelectItem>
                    {Array.isArray(academicYears) &&
                      academicYears.map((y) => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.tahunMulai}/{y.tahunSelesai} - {y.semester}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Select
                  value={selectedSemester}
                  onValueChange={(val) => setSelectedSemester(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Semester</SelectItem>
                    <SelectItem value="GANJIL">GANJIL</SelectItem>
                    <SelectItem value="GENAP">GENAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Select
                  value={selectedType}
                  onValueChange={(val) => setSelectedType(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Jenis Ujian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="midterm">UTS</SelectItem>
                    <SelectItem value="final_exam">UAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all">
              <DataTable
                data={filteredData}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data ujian..."
                emptyMessage="Belum ada ujian tersedia"
                keyExtractor={(item) => item.id}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
