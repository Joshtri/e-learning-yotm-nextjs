"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataExport } from "@/components/ui/data-export";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminQuizPage() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeClass, setActiveClass] = useState("all");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/quizzes");
      setData(res.data.data || []);
    } catch (err) {
      console.error("Gagal memuat data:", err);
      toast.error("Gagal memuat kuis");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const classOptions = useMemo(() => {
    const unique = new Map();
    data.forEach((item) => {
      const cls = item.classSubjectTutor?.class;
      if (cls?.id && !unique.has(cls.id)) {
        unique.set(cls.id, cls.namaKelas);
      }
    });
    return Array.from(unique.entries()); // [ [id, namaKelas], ... ]
  }, [data]);

  const filterBySearch = (list) => {
    if (!searchQuery) return list;
    return list.filter((item) =>
      [
        item.judul,
        item.jenis,
        item.classSubjectTutor?.class?.namaKelas,
        item.classSubjectTutor?.subject?.namaMapel,
        item.classSubjectTutor?.tutor?.namaLengkap,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  };

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Judul Kuis",
      cell: (row) => row.judul,
    },
    {
      header: "Jenis",
      cell: (row) => row.jenis,
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
      header: "Aktif",
      cell: (row) =>
        `${new Date(row.waktuMulai).toLocaleDateString("id-ID")} - ${new Date(
          row.waktuSelesai
        ).toLocaleDateString("id-ID")}`,
    },
    {
      header: "Nilai Maks",
      cell: (row) => row.nilaiMaksimal ?? "-",
    },
    {
      header: "Aksi",
      cell: (row) => (
        <Link href={`/admin/quizzes/${row.id}`}>
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
            title="Daftar Kuis"
            description="Semua kuis yang dibuat oleh tutor"
            actions={
              <DataExport
                data={filterBySearch(data)}
                filename="kuis.csv"
                label="Export"
              />
            }
          />

          <Tabs value={activeClass} onValueChange={setActiveClass}>
            <TabsList>
              <TabsTrigger value="all">Semua Kelas</TabsTrigger>
              {classOptions.map(([id, name]) => (
                <TabsTrigger key={id} value={id}>
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-4 space-y-4">
              <DataToolbar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari judul, kelas, mapel, atau tutor..."
                filterOptions={[]}
              />

              <TabsContent value="all">
                <DataTable
                  data={filterBySearch(data)}
                  columns={columns}
                  isLoading={isLoading}
                  loadingMessage="Memuat data kuis..."
                  emptyMessage="Tidak ada kuis ditemukan"
                  keyExtractor={(item) => item.id}
                />
              </TabsContent>

              {classOptions.map(([id, _]) => {
                const filtered = data.filter(
                  (item) => item.classSubjectTutor?.class?.id === id
                );
                return (
                  <TabsContent key={id} value={id}>
                    <DataTable
                      data={filterBySearch(filtered)}
                      columns={columns}
                      isLoading={isLoading}
                      loadingMessage="Memuat data kuis..."
                      emptyMessage="Tidak ada kuis ditemukan untuk kelas ini"
                      keyExtractor={(item) => item.id}
                    />
                  </TabsContent>
                );
              })}
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
