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

  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [examRes, subjectRes, yearRes] = await Promise.all([
        api.get("/student/daily-exams", { params: { academicYearId: selectedYear === "all" ? undefined : selectedYear, semester: selectedSemester === "all" ? undefined : selectedSemester } }),
        api.get("/subjects"),
        api.get("/academic-years"),
      ]);
      setData(examRes.data.data);
      setSubjects(subjectRes.data.data.subjects || []);
      setAcademicYears(yearRes.data.data.academicYears);
    } catch (err) {
      toast.error("Gagal memuat data ujian harian");
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

    return matchSearch && matchSubject;
  });

  const columns = [
    { header: "Judul", cell: (row) => row.judul },
    {
      header: "Jenis Ujian",
      cell: (row) => (
        <Badge variant="secondary">
          {row.jenis === "DAILY_TEST" ? "Ujian Harian" : "Ujian Awal Semester"}
        </Badge>
      ),
    },
    { header: "Mata Pelajaran", cell: (row) => row.subject?.namaMapel || "-" },
    {
      header: "Tahun Ajaran",
      cell: (row) =>
        row.class?.academicYear
          ? `${row.class.academicYear.tahunMulai}/${row.class.academicYear.tahunSelesai} - ${row.class.academicYear.semester}`
          : "-",
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
              href={`/siswa/daily-exams/${row.id}/start`}
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
            title="Ujian Harian & Awal Semester"
            description="Daftar ujian harian dan awal semester Anda"
            breadcrumbs={[
              { label: "Dashboard", href: "/siswa/dashboard" },
              { label: "Ujian Harian & Awal Semester" },
            ]}
          />

          <Tabs defaultValue="all">
            <DataToolbar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari judul atau mapel..."
              filterOptions={[
                {
                  label: "Mata Pelajaran",
                  content: (
                    <Select
                      value={selectedSubject}
                      onValueChange={(val) => setSelectedSubject(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Mapel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Mapel</SelectItem>
                        {subjects.map((s) => (
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
                      onValueChange={(val) => setSelectedYear(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tahun Ajaran" />
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
                  ),
                },
                {
                  label: "Semester",
                  content: (
                    <Select
                      value={selectedSemester}
                      onValueChange={(val) => setSelectedSemester(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Semester</SelectItem>
                        <SelectItem value="GANJIL">GANJIL</SelectItem>
                        <SelectItem value="GENAP">GENAP</SelectItem>
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

//             <TabsContent value="all">
//               <DataTable
//                 data={filteredData}
//                 columns={columns}
//                 isLoading={isLoading}
//                 loadingMessage="Memuat data ujian harian..."
//                 emptyMessage="Belum ada ujian tersedia"
//                 keyExtractor={(item) => item.id}
//               />
//             </TabsContent>
//           </Tabs>
//         </main>
//       </div>
//     </div>
//   );
// }
