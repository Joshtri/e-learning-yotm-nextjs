"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import ProgramSubjectAddModal from "@/components/program-subject/ProgramSubjectAddModal";
import { Button } from "@/components/ui/button";
import { DataExport } from "@/components/ui/data-export";
import { DataTable } from "@/components/ui/data-table";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function ProgramSubjectPage() {
  const [data, setData] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const router = useRouter();

  // Pagination state, simpan total dan pages dari API juga
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const params = {
    page: pagination.page,
    search: searchQuery,
  };
  if (pagination.limit && pagination.limit > 0) {
    params.limit = pagination.limit;
  }

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [res, progRes, subRes] = await Promise.all([
        api.get("/program-subjects", { params }),
        api.get("/programs"),
        api.get("/subjects", { params: { page: 1, limit: 50 } }),
      ]);

      setData(res.data.data.programSubjects);
      setPrograms(progRes.data.data.programs);
      setSubjects(subRes.data.data.subjects);

      // Update total dan pages dari response
      if (res.data.data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: res.data.data.pagination.total,
          pages: res.data.data.pagination.pages,
        }));
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
      toast.error("Gagal memuat data program-subject");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch ulang data kalau page, limit, atau search berubah
  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit, searchQuery]);

  // Handler pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Optional: handler untuk ubah limit jika mau buat dropdown limit

  const columns = [
    {
      header: "No",
      cell: (_, index) => (pagination.page - 1) * pagination.limit + index + 1,
      className: "w-[50px]",
    },
    {
      header: "Paket / Program",
      cell: (row) => row.program?.namaPaket || "-",
    },
    {
      header: "Mata Pelajaran",
      cell: (row) => row.subject?.namaMapel || "-",
    },
    {
      header: "Aksi",
      className: "w-[120px]",
      cell: (row) => (
        <>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                router.push(`/admin/program-subject/${row.id}/edit`)
              }
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(row.id)}
            >
              Hapus
            </Button>
          </div>
        </>
      ),
    },
  ];

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    try {
      await api.delete(`/program-subjects/${id}`);
      toast.success("Berhasil menghapus data");
      // Kalau data di halaman terakhir habis dihapus, pindah ke halaman sebelumnya
      if (data.length === 1 && pagination.page > 1) {
        setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
      } else {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus data");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Manajemen Mapel per Program"
            actions={
              <>
                <DataExport
                  data={data}
                  filename="program-subject.csv"
                  label="Export"
                />
                <Button className="ml-2" onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Mapel Program
                </Button>
              </>
            }
            description="Mengelola mata pelajaran berdasarkan program yang ada."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Program Mapel" },
            ]}
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) =>
                setPagination((p) => ({ ...p, page: 1 })) ||
                setSearchQuery(value)
              }
              searchPlaceholder="Cari berdasarkan program atau mapel..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-6">
              {Object.entries(
                data.reduce((acc, item) => {
                  const programName =
                    item.program?.namaPaket || "Tanpa Program";
                  if (!acc[programName]) acc[programName] = [];
                  acc[programName].push(item);
                  return acc;
                }, {})
              ).map(([programName, groupedItems]) => (
                <div key={programName} className="space-y-2">
                  <h2 className="text-lg font-semibold">{programName}</h2>
                  <DataTable
                    data={groupedItems}
                    columns={columns}
                    isLoading={isLoading}
                    loadingMessage={`Memuat data...`}
                    emptyMessage={`Tidak ada data untuk ${programName}`}
                    keyExtractor={(item) => item.id}
                  />
                </div>
              ))}

              {/* Pagination Controls */}
              <div className="flex justify-center items-center space-x-4 mt-6">
                <Button
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Prev
                </Button>
                <span>
                  Halaman {pagination.page} dari {pagination.pages || 1}
                </span>
                <Button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <ProgramSubjectAddModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setEditData(null);
        }}
        programs={programs}
        subjects={subjects}
        editData={editData}
      />
    </div>
  );
}
