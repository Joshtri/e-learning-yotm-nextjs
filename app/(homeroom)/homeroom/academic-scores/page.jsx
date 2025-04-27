"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function HomeroomAcademicScoresPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScores = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/homeroom/academic-scores");
      setData(res.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat rekap nilai siswa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Siswa",
      cell: (row) => (
        <div className="font-medium">{row.student?.namaLengkap || "-"}</div>
      ),
    },
    {
      header: "Mata Pelajaran",
      cell: (row) => (
        <div className="text-sm">{row.subject?.namaMapel || "-"}</div>
      ),
    },
    {
      header: "Nilai",
      cell: (row) => (
        <div className="text-center font-semibold">{row.nilai ?? "-"}</div>
      ),
    },
    {
      header: "Keterangan",
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          {row.keterangan || "-"}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Rekap Nilai Akademik"
        description="Lihat nilai akademik siswa di kelas Anda."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Rekap Nilai Akademik" },
        ]}
      />

      {data.length > 0 ? (
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          loadingMessage="Memuat nilai siswa..."
          emptyMessage="Belum ada data nilai."
          keyExtractor={(item) => item.id}
        />
      ) : (
        <EmptyState
          title="Belum ada nilai"
          description="Data nilai akademik siswa belum tersedia."
          icon={<GraduationCap className="h-8 w-8 text-muted-foreground" />}
        />
      )}
    </div>
  );
}
