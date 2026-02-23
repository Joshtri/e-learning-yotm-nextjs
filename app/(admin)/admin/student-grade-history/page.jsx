"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataTable } from "@/components/ui/data-table";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";

export default function StudentGradeHistoryPage() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const router = useRouter();

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(
        `/admin/student-grade-history?${params.toString()}`
      );
      setStudents(response.data.data.students);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Gagal memuat data siswa:", error);
      toast.error("Gagal memuat data siswa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [pagination.page, pagination.limit, searchQuery]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => (pagination.page - 1) * pagination.limit + index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Siswa",
      cell: (student) => (
        <div className="flex items-center gap-2">
          <EntityAvatar name={student.namaLengkap || "-"} />
          <div>
            <div className="font-medium">{student.namaLengkap || "-"}</div>
            <div className="text-xs text-muted-foreground">
              {student.user?.email || "-"}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "NISN",
      cell: (student) => student.nisn || "-",
    },
    {
      header: "Program",
      cell: (student) => student.class?.program?.namaPaket || "-",
    },
    {
      header: "Kelas Aktif",
      cell: (student) => student.class?.namaKelas || (
        <span className="text-muted-foreground italic text-sm">Tidak ada kelas</span>
      ),
    },
    {
      header: "Status",
      cell: (student) => {
        const statusMap = {
          ACTIVE: { label: "Aktif", variant: "default" },
          INACTIVE: { label: "Nonaktif", variant: "secondary" },
          GRADUATED: { label: "Lulus", variant: "outline" },
          DROPPED: { label: "Keluar", variant: "destructive" },
        };
        const s = statusMap[student.status] || { label: student.status, variant: "outline" };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      header: "Aksi",
      cell: (student) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            router.push(`/admin/student-grade-history/${student.id}`)
          }
        >
          <FileSearch className="mr-1 h-3.5 w-3.5" />
          Lihat Rapor
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Riwayat Rapor Siswa"
            description="Lihat rekap nilai dan riwayat akademik siswa selama masa studinya."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Riwayat Rapor Siswa" },
            ]}
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              searchPlaceholder="Cari nama siswa, NISN, atau email..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={students}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data siswa..."
                emptyMessage="Tidak ada data siswa yang ditemukan"
                keyExtractor={(student) => student.id}
                pagination={{
                  currentPage: pagination.page,
                  totalPages: pagination.pages,
                  onPageChange: (newPage) =>
                    setPagination((prev) => ({ ...prev, page: newPage })),
                  totalItems: pagination.total,
                  itemsPerPage: pagination.limit,
                }}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
