"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProgramAddModal from "@/components/program/ProgramAddModal";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataExport } from "@/components/ui/data-export";

export default function ProgramPage() {
  const [programs, setPrograms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [openModal, setOpenModal] = useState(false);

  const router = useRouter();

  const fetchPrograms = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`/programs?${params.toString()}`);
      setPrograms(response.data.data.programs);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Gagal memuat data program:", error);
      toast.error("Gagal memuat data program");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [pagination.page, pagination.limit, searchQuery]);

  const filteredPrograms = useMemo(() => {
    if (!searchQuery) return programs;
    return programs.filter((item) =>
      item.namaPaket.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [programs, searchQuery]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => (pagination.page - 1) * pagination.limit + index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Program",
      accessorKey: "namaPaket",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Manajemen Program"
            actions={
              <>
                <DataExport
                  data={programs}
                  filename="programs.csv"
                  label="Export"
                />
                <Button className="ml-2" onClick={() => setOpenModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Program
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
              searchPlaceholder="Cari nama program..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredPrograms}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data program..."
                emptyMessage="Tidak ada program ditemukan"
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

          <ProgramAddModal
            open={openModal}
            onClose={() => setOpenModal(false)}
            onSuccess={fetchPrograms}
          />
        </main>
      </div>
    </div>
  );
}
