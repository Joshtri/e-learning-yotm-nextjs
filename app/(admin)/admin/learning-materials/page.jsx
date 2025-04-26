"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataExport } from "@/components/ui/data-export";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearningMaterialPage() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeClass, setActiveClass] = useState("all");

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

  const classOptions = useMemo(() => {
    const unique = new Map();
    data.forEach((item) => {
      const cls = item.classSubjectTutor?.class;
      if (cls && !unique.has(cls.id)) {
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
      header: "Judul",
      cell: (row) => row.judul,
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
              <DataExport
                data={filterBySearch(data)}
                filename="materi.csv"
                label="Export"
              />
            }
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Materi Pembelajaran" },
            ]}
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
                onSearchChange={(value) => setSearchQuery(value)}
                searchPlaceholder="Cari judul, mapel, atau tutor..."
                filterOptions={[]}
              />

              <TabsContent value="all">
                <DataTable
                  data={filterBySearch(data)}
                  columns={columns}
                  isLoading={isLoading}
                  loadingMessage="Memuat data materi..."
                  emptyMessage="Tidak ada materi ditemukan"
                  keyExtractor={(item) => item.id}
                />
              </TabsContent>

              {classOptions.map(([id, _]) => {
                const classFiltered = data.filter(
                  (item) => item.classSubjectTutor?.class?.id === id
                );
                return (
                  <TabsContent key={id} value={id}>
                    <DataTable
                      data={filterBySearch(classFiltered)}
                      columns={columns}
                      isLoading={isLoading}
                      loadingMessage="Memuat data materi..."
                      emptyMessage="Tidak ada materi ditemukan untuk kelas ini"
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
