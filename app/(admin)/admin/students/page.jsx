"use client";

import { useEffect, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataTable } from "@/components/ui/data-table";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataExport } from "@/components/ui/data-export";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`/students?${params.toString()}`);
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

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter((student) => {
      return (
        student.user?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.nisn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [students, searchQuery]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => (pagination.page - 1) * pagination.limit + index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama",
      cell: (student) => (
        <div className="flex items-center gap-2">
          <EntityAvatar name={student.user?.nama || "-"} />
          <div className="font-medium">{student.user?.nama || "-"}</div>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "user.email",
    },
    {
      header: "NISN",
      accessorKey: "nisn",
    },
    {
      header: "Jenis Kelamin",
      accessorKey: "jenisKelamin",
    },
    {
      header: "Kelas",
      cell: (student) =>
        student.class?.name || <span className="text-muted-foreground">Belum terdaftar</span>,
    },
    {
      header: "Tanggal Lahir",
      cell: (student) =>
        student.tanggalLahir
          ? new Date(student.tanggalLahir).toLocaleDateString("id-ID")
          : "-",
    },
    {
      header: "Alamat",
      accessorKey: "alamat",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Manajemen Siswa"
            actions={
              <>
                <DataExport data={students} filename="students.csv" label="Export" />
                <Button disabled>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tambah Siswa
                </Button>
              </>
            }
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              searchPlaceholder="Cari siswa..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredStudents}
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
