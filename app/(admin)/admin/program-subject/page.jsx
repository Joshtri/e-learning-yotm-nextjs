"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataExport } from "@/components/ui/data-export";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import ProgramSubjectAddModal from "@/components/program-subject/ProgramSubjectAddModal";

export default function ProgramSubjectPage() {
  const [data, setData] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [res, progRes, subRes] = await Promise.all([
        api.get("/program-subjects"),
        api.get("/programs"),
        api.get("/subjects"),
      ]);

      setData(res.data.data.programSubjects);
      setPrograms(progRes.data.data.programs);
      setSubjects(subRes.data.data.subjects);
    } catch (error) {
      console.error("Gagal memuat data:", error);
      toast.error("Gagal memuat data program-subject");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter((item) =>
      item.program.namaPaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.namaMapel.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
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
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Manajemen Mapel per Program"
            actions={
              <>
                <DataExport data={data} filename="program-subject.csv" label="Export" />
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
            ]} // Add breadcrumbs here
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => setSearchQuery(value)}
              searchPlaceholder="Cari berdasarkan program atau mapel..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredData}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data..."
                emptyMessage="Tidak ada data ditemukan"
                keyExtractor={(item) => item.id}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <ProgramSubjectAddModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        programs={programs}
        subjects={subjects}
      />
    </div>
  );
}
