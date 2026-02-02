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

export default function DailyExamsPage() {
  const [data, setData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [studentProgramId, setStudentProgramId] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const params = {};
      if (selectedYear !== "all") {
        params.academicYearId = selectedYear;
      }
      if (selectedSemester !== "all") {
        params.semester = selectedSemester;
      }

      // Fetch student's class to get programId
      const [examRes, subjectRes, yearRes, authRes] = await Promise.all([
        api.get("/student/daily-exams", { params }),
        api.get("/subjects"),
        api.get("/academic-years"),
        api.get("/auth/me"),
      ]);

      // Get student's class programId
      const studentClassId = authRes.data.user?.student?.classId;
      if (studentClassId) {
        try {
          const classRes = await api.get(`/classes/${studentClassId}`);
          setStudentProgramId(classRes.data.data?.programId || null);
        } catch (err) {
          console.error("Error fetching class:", err);
        }
      }

      setData(examRes.data.data || []);
      setSubjects(subjectRes.data.data.subjects || []);
      setAcademicYears(yearRes.data.data.academicYears || []);
    } catch (err) {
      console.error("Error fetching daily exams:", err);
      toast.error("Gagal memuat data ujian harian");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter subjects berdasarkan program siswa
  const filteredSubjects = studentProgramId
    ? subjects.filter((s) => s.programId === studentProgramId)
    : subjects;

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    if (academicYears.length > 0 && selectedYear === "all") {
      const activeYear = academicYears.find((ay) => ay.isActive);
      if (activeYear) {
        setSelectedYear(activeYear.id);
      } else {
        setSelectedYear(academicYears[0].id);
      }
    }
  }, [academicYears, selectedYear]);

  const filteredData = data.filter((item) => {
    const matchSearch =
      item.judul.toLowerCase().includes(search.toLowerCase()) ||
      item.subject?.namaMapel.toLowerCase().includes(search.toLowerCase());

    const matchSubject =
      selectedSubject === "all" || item.subject?.id === selectedSubject;

    return matchSearch && matchSubject;
  });

  const getExamStatus = (exam) => {
    const now = new Date();
    const start = new Date(exam.waktuMulai);
    const end = new Date(exam.waktuSelesai);

    if (exam.sudahDikerjakan) {
      return { label: "Selesai", variant: "success" };
    }

    if (now >= start && now <= end) {
      return { label: "Sedang Berlangsung", variant: "default" };
    }

    if (now < start) {
      return { label: "Belum Dimulai", variant: "secondary" };
    }

    return { label: "Sudah Berakhir", variant: "destructive" };
  };

  const columns = [
    {
      header: "Judul",
      cell: (row) => (
        <div className="font-medium">{row.judul}</div>
      )
    },
    {
      header: "Jenis Ujian",
      cell: (row) => (
        <Badge variant="outline">
          {row.jenis === "DAILY_TEST" ? "Ujian Harian" : "Ujian Awal Semester"}
        </Badge>
      ),
    },
    {
      header: "Mata Pelajaran",
      cell: (row) => row.subject?.namaMapel || "-"
    },
    {
      header: "Tahun Ajaran",
      cell: (row) =>
        row.class?.academicYear
          ? `${row.class.academicYear.tahunMulai}/${row.class.academicYear.tahunSelesai} - ${row.class.academicYear.semester}`
          : "-",
    },
    {
      header: "Tutor",
      cell: (row) => row.tutor?.namaLengkap || "-"
    },
    {
      header: "Waktu Mulai",
      cell: (row) => {
        const date = new Date(row.waktuMulai);
        return date.toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      },
    },
    {
      header: "Waktu Selesai",
      cell: (row) => {
        const date = new Date(row.waktuSelesai);
        return date.toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      },
    },
    {
      header: "Status",
      cell: (row) => {
        const status = getExamStatus(row);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      header: "Aksi",
      cell: (row) => {
        const now = new Date();
        const start = new Date(row.waktuMulai);
        const end = new Date(row.waktuSelesai);

        if (row.sudahDikerjakan) {
          return <span className="text-green-600 font-medium">✓ Selesai</span>;
        }

        if (now >= start && now <= end) {
          return (
            <a
              href={`/siswa/assignments/${row.id}/start`}
              className="text-sm text-blue-600 underline hover:text-blue-800 font-medium"
            >
              Kerjakan
            </a>
          );
        }

        if (now < start) {
          return <span className="text-muted-foreground text-sm">Belum dimulai</span>;
        }

        return <span className="text-muted-foreground text-sm">Sudah berakhir</span>;
      },
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6 space-y-4">
          <PageHeader
            title="Ujian Harian & Awal Semester"
            description="Daftar ujian harian dan ujian awal semester yang tersedia"
            breadcrumbs={[
              { label: "Dashboard", href: "/siswa/dashboard" },
              { label: "Ujian Harian & Awal Semester" },
            ]}
          />

          <Tabs defaultValue="all">
            <DataToolbar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari judul atau mata pelajaran..."
              filterOptions={[
                {
                  label: "Mata Pelajaran",
                  content: (
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Mata Pelajaran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                        {filteredSubjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.namaMapel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ),
                },
                {
                  label: "Tahun Ajaran",
                  content: (
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tahun Ajaran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                        {academicYears.map((y) => (
                          <SelectItem key={y.id} value={y.id}>
                            {y.tahunMulai}/{y.tahunSelesai} - {y.semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ),
                },
                {
                  label: "Semester",
                  content: (
                    <Select
                      value={selectedSemester}
                      onValueChange={setSelectedSemester}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Semester</SelectItem>
                        <SelectItem value="GANJIL">Ganjil</SelectItem>
                        <SelectItem value="GENAP">Genap</SelectItem>
                      </SelectContent>
                    </Select>
                  ),
                },
              ]}
            />

            <TabsContent value="all">
              <DataTable
                data={filteredData}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data ujian harian..."
                emptyMessage="Belum ada ujian harian atau ujian awal semester yang tersedia"
                keyExtractor={(item) => item.id}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
