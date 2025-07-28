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
import SubjectCreateModal from "@/components/subject/SubjectCreateModal";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function SubjectPage() {
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const router = useRouter();

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`/subjects?${params.toString()}`);
      setSubjects(response.data.data.subjects || []);
      setPagination(response.data.data.pagination || {});
    } catch (error) {
      console.error("Gagal memuat data mapel:", error);
      toast.error("Gagal memuat data mata pelajaran");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [pagination.page, pagination.limit, searchQuery]);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery) return subjects;
    return subjects.filter((item) =>
      item.namaMapel.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subjects, searchQuery]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => (pagination.page - 1) * pagination.limit + index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Mapel",
      accessorKey: "namaMapel",
    },
    {
      header: "Deskripsi",
      accessorKey: "deskripsi",
      cell: (item) =>
        item.deskripsi || <span className="text-muted-foreground">-</span>,
    },

    {
      header: "Aksi",
      cell: (item) => (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/subject/${item.id}/edit`)}
          >
            Edit
          </Button>


          <Button
            variant="destructive"
            size="sm"
            className="ml-2"
            onClick={async () => {
              if (confirm("Yakin ingin menghapus mata pelajaran ini?")) {
                try {
                  await api.delete(`/subjects/${item.id}`);
                  toast.success("Mata pelajaran berhasil dihapus");
                  fetchSubjects();
                } catch (error) {
                  console.error("Gagal menghapus mapel:", error);
                  toast.error("Gagal menghapus mata pelajaran");
                }
              }
            }}
          >
            Hapus
          </Button>
        </>
      ),
      className: "w-[120px] text-right",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Manajemen Mata Pelajaran 3"
            actions={
              <>
                <DataExport
                  data={subjects}
                  filename="subjects.csv"
                  label="Export"
                />
                <Button
                  className="ml-2"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Mapel
                </Button>
              </>
            }
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Mata Pelajaran" },
            ]}
            description="Mengelola mata pelajaran yang tersedia di sistem."
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              searchPlaceholder="Cari nama mapel..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredSubjects}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data mata pelajaran..."
                emptyMessage="Tidak ada data mata pelajaran ditemukan"
                keyExtractor={(item) => item.id}
                pagination={null} // atau bisa dihapus kalau tidak dipakai
              />

              {/* Tambahkan Pagination di sini */}
              <Pagination className="mt-4">
                <PaginationContent>
                  {pagination.page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: pagination.pages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={pagination.page === i + 1}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: i + 1 }))
                        }
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {pagination.page < pagination.pages && (
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </TabsContent>
          </Tabs>

          <SubjectCreateModal
            open={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={fetchSubjects}
          />
        </main>
      </div>
    </div>
  );
}
