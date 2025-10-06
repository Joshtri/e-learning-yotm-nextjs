"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataExport } from "@/components/ui/data-export";
import AcademicYearAddModal from "@/components/academic-years/AcademicYearAddModal";
import { Switch } from "@/components/ui/switch";

export default function AcademicYearPage() {
  const [academicYears, setAcademicYears] = useState([]);
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

  const fetchAcademicYears = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`/academic-years?${params.toString()}`);
      setAcademicYears(response.data.data.academicYears);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Gagal memuat data tahun ajaran:", error);
      toast.error("Gagal memuat data tahun ajaran");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, [pagination.page, pagination.limit, searchQuery]);

  const filteredAcademicYears = useMemo(() => {
    if (!searchQuery) return academicYears;
    return academicYears.filter((item) =>
      `${item.tahunMulai}/${item.tahunSelesai}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [academicYears, searchQuery]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => (pagination.page - 1) * pagination.limit + index + 1,
      className: "w-[50px]",
    },
    {
      header: "Tahun Ajaran",
      cell: (item) => `${item.tahunMulai}/${item.tahunSelesai}`,
    },
    // {
    //   header: "Status",
    //   cell: (item) =>
    //     item.isActive ? (
    //       <span className="text-green-600 font-semibold">Aktif</span>
    //     ) : (
    //       <span className="text-muted-foreground">Tidak Aktif</span>
    //     ),
    // },

    {
      header: "Status",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={item.isActive}
            onCheckedChange={async (checked) => {
              if (checked) {
                try {
                  await api.patch(`/academic-years/${item.id}/activate`);
                  toast.success("Tahun ajaran diaktifkan");
                  fetchAcademicYears(); // refresh
                } catch (error) {
                  console.error("Gagal aktifkan tahun ajaran:", error);
                  toast.error("Gagal mengaktifkan tahun ajaran");
                }
              } else {
                toast.info(
                  "Tidak bisa menonaktifkan manual. Pilih tahun lain."
                );
              }
            }}
          />
          <span
            className={
              item.isActive
                ? "text-green-600 font-semibold"
                : "text-muted-foreground"
            }
          >
            {item.isActive ? "Aktif" : "Tidak Aktif"}
          </span>
        </div>
      ),
    },

    {
      header: "Semester",
      cell: (item) => item.semester,
      // className: "w-[120px]",
    },

    {
      header: "Aksi",
      cell: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/academic-years/${item.id}/edit`)}
        >
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>
      ),
      className: "w-[120px]",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Tahun Ajaran" },
            ]} // Add breadcrumbs here
            title="Manajemen Tahun Ajaran"
            actions={
              <>
                <DataExport
                  data={academicYears}
                  filename="academic-years.csv"
                  label="Export"
                />
                <Button
                  className="ml-2"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Tahun Ajaran
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
              searchPlaceholder="Cari tahun ajaran..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredAcademicYears}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data tahun ajaran..."
                emptyMessage="Tidak ada tahun ajaran ditemukan"
                keyExtractor={(item) => item.id}
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
          <AcademicYearAddModal
            open={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={fetchAcademicYears}
          />
        </main>
      </div>
    </div>
  );
}
