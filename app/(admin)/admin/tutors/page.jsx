"use client";

import { useEffect, useMemo, useState } from "react";
import { UserPlus, Trash } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataTable } from "@/components/ui/data-table";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { DataExport } from "@/components/ui/data-export";
import { EntityActions } from "@/components/ui/entity-actions";

export default function TutorPage() {
  const [tutors, setTutors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const router = useRouter();

  const fetchTutors = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`/tutors?${params.toString()}`);
      setTutors(response.data.data.tutors);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Gagal memuat data tutor:", error);
      toast.error("Gagal memuat data tutor");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, [pagination.page, pagination.limit, searchQuery]);

  const filteredTutors = useMemo(() => {
    if (!searchQuery) return tutors;
    return tutors.filter((tutor) => {
      return (
        tutor.user?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.namaLengkap?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [tutors, searchQuery]);

  const handleDeleteTutor = async (tutorId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus tutor ini?")) return;

    try {
      await api.delete(`/tutors/${tutorId}`);
      toast.success("Tutor berhasil dihapus");
      fetchTutors();
    } catch (err) {
      console.error("Gagal menghapus tutor:", err);
      toast.error("Gagal menghapus tutor");
    }
  };

  const columns = [
    {
      header: "No",
      cell: (_, index) => (pagination.page - 1) * pagination.limit + index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama",
      cell: (tutor) => (
        <div className="flex items-center gap-2">
          <EntityAvatar name={tutor.user?.nama || tutor.namaLengkap || "-"} />
          <div className="font-medium">{tutor.namaLengkap || "-"}</div>
        </div>
      ),
    },
    {
      header: "Email",
      cell: (tutor) => tutor.user?.email || "-",
    },
    {
      header: "Telepon",
      cell: (tutor) => tutor.telepon || "-",
    },
    {
      header: "Pendidikan",
      cell: (tutor) => tutor.pendidikan || "-",
    },
    {
      header: "Pengalaman",
      cell: (tutor) => tutor.pengalaman || "-",
    },
    {
      header: "Status",
      cell: (tutor) => (
        <span className="text-sm font-medium">
          {tutor.status === "ACTIVE"
            ? "Aktif"
            : tutor.status === "INACTIVE"
              ? "Nonaktif"
              : "Menunggu"}
        </span>
      ),
    },
    {
      header: "Aksi",
      cell: (tutor) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push(`/admin/tutors/${tutor.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeleteTutor(tutor.id)}
            title="Hapus Tutor"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Manajemen Tutor"
            actions={
              <>
                <DataExport
                  data={tutors}
                  filename="tutors.csv"
                  label="Export"
                />
                <Button
                  className="ml-2"
                  onClick={() => router.push("/admin/tutors/create")}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tambah Tutor
                </Button>
              </>
            }
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Tutor" },
            ]}
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              searchPlaceholder="Cari nama atau email tutor..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredTutors}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data tutor..."
                emptyMessage="Tidak ada data tutor yang ditemukan"
                keyExtractor={(tutor) => tutor.id}
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
