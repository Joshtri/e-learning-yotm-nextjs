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
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [examRes, subjectRes] = await Promise.all([
        api.get("/student/daily-exams"), // kamu harus siapkan endpoint ini
        api.get("/subjects"),
      ]);
      setData(examRes.data.data);
      setSubjects(subjectRes.data.data.subjects || []); // <<< Fix disini
    } catch (err) {
      toast.error("Gagal memuat data ujian harian");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
