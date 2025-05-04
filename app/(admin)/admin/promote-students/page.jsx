"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

export default function AdminPromoteStudentsPage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/admin/promote-students");
      setStudents(res.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data promosi siswa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPromotions = async () => {
    try {
      const res = await api.patch("/admin/promote-students/process");
      const { message, detail } = res.data;
  
      toast.success(message);
  
      // Optional: log detail atau tampilkan di UI modal/toast lain
      console.log("Detail Promosi:", detail);
  
      fetchStudents();
    } catch (error) {
      console.error(error);
      toast.error("Gagal memproses promosi siswa");
    }
  };
  

  return (
    <div className="p-6">
      <PageHeader
        title="Persetujuan Naik Kelas"
        description="Halaman ini menampilkan siswa yang telah diusulkan naik kelas oleh wali kelas. Admin dapat meninjau dan memprosesnya."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Promosi Siswa" },
        ]}
      />

      <div className="space-y-6 mt-6">
        <DataTable
          data={students}
          columns={[
            { header: "No", cell: (_, i) => i + 1, className: "w-[50px]" },
            { header: "Nama Siswa", cell: (row) => row.namaLengkap },
            { header: "Kelas", cell: (row) => row.class?.namaKelas ?? "-" },
            {
              header: "Nilai Akhir",
              cell: (row) => {
                const scores =
                  row.FinalScore?.map((fs) => fs.nilaiAkhir).filter(
                    (n) => typeof n === "number"
                  ) || [];
                if (scores.length === 0) return "-";
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                return avg.toFixed(2);
              },
            },
            {
              header: "Kehadiran (%)",
              cell: (row) =>
                row.attendanceSummary?.persen?.toFixed(1) + "%" || "-",
            },
            {
              header: "Status Naik",
              cell: () => "Diusulkan",
            },
          ]}
          isLoading={isLoading}
          loadingMessage="Memuat siswa..."
          emptyMessage="Tidak ada siswa yang diusulkan naik kelas"
          keyExtractor={(s) => s.id}
        />

        <div className="flex justify-end">
          <Button
            onClick={handleProcessPromotions}
            disabled={students.length === 0}
          >
            Proses Kenaikan Kelas
          </Button>
        </div>
      </div>
    </div>
  );
}
