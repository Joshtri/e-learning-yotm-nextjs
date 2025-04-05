"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent } from "@/components/ui/tabs";

export default function ExamSubmissionsPage() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/tutor/exams/${id}/submissions`);
      setData(res.data.data || []);
    } catch (error) {
      console.error("Gagal ambil hasil ujian:", error);
      toast.error("Gagal memuat hasil ujian");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Siswa",
      cell: (row) => row.student?.namaLengkap || "-",
    },
    {
      header: "Status",
      cell: (row) => row.status,
    },
    {
      header: "Nilai",
      cell: (row) => row.nilai ?? "-",
    },
    {
      header: "Waktu Kumpul",
      cell: (row) =>
        row.waktuKumpul
          ? new Date(row.waktuKumpul).toLocaleString("id-ID")
          : "-",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Hasil Ujian"
            description="Daftar siswa yang telah mengerjakan ujian ini."
            backButton={true}
            backButtonLink={`/tutor/exams/${id}`}
            backButtonLabel="Kembali ke Ujian"
            breadcrumbs={[
              { label: "Ujian", href: "/tutor/exams" },
              { label: "Hasil Ujian", href: `/tutor/exams/${id}` },
            ]}
          />

          <Tabs defaultValue="all" className="space-y-6">
            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={data}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat hasil ujian..."
                emptyMessage="Belum ada siswa yang mengerjakan"
                keyExtractor={(item) => item.id}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
