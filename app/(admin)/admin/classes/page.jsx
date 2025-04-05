"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataExport } from "@/components/ui/data-export";

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const router = useRouter();

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`/classes?${params.toString()}`);
      setClasses(response.data.data.classes);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Gagal memuat data kelas:", error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [pagination.page, pagination.limit, searchQuery]);

  const filteredClasses = useMemo(() => {
    if (!searchQuery) return classes;
    return classes.filter((cls) =>
      cls.namaKelas.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [classes, searchQuery]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => (pagination.page - 1) * pagination.limit + index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Kelas",
      accessorKey: "namaKelas",
    },
    {
      header: "Program",
      cell: (row) => row.program?.namaPaket || "-",
    },
    {
      header: "Tahun Ajaran",
      cell: (row) =>
        row.academicYear
          ? `${row.academicYear.tahunMulai}/${row.academicYear.tahunSelesai}`
          : "-",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Manajemen Kelas"
            actions={
              <>
                <DataExport data={classes} filename="classes.csv" label="Export" />
                <Button className="ml-2" onClick={() => router.push("/admin/classes/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kelas
                </Button>
              </>
            }

            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Kelas" },
            ]}
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              searchPlaceholder="Cari nama kelas..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredClasses}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data kelas..."
                emptyMessage="Tidak ada data kelas yang ditemukan"
                keyExtractor={(cls) => cls.id}
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
