"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function PromoteStudentsPage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/homeroom/my-students-for-promotion");
      setStudents(res.data.data || []); // ⬅️ langsung data saja, BUKAN data.students
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data siswa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchChange = (studentId, checked) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, naikKelas: checked } : s))
    );
  };

  const handlePromote = async () => {
    try {
      await api.patch("/homeroom/promote-students", {
        promotions: students.map((s) => ({
          studentId: s.id,
          naikKelas: s.naikKelas || false,
        })),
      });
      toast.success("Berhasil menyimpan promosi siswa");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan promosi siswa");
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Manajemen Naik Kelas"
        description="Kelola kenaikan kelas siswa Anda."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Manajemen Naik Kelas" },
        ]}
      />

      <div className="space-y-6 mt-6">
        <DataTable
          data={students}
          columns={[
            {
              header: "No",
              cell: (_, i) => i + 1,
              className: "w-[50px]",
            },
            { header: "Nama Siswa", cell: (row) => row.namaLengkap },
            {
              header: "Nilai Akhir",
              cell: (row) => (row.nilaiAkhir ?? "-").toString(),
            },
            {
              header: "Status Naik",
              cell: (row) => (
                <Switch
                  checked={!!row.naikKelas}
                  onCheckedChange={(val) => handleSwitchChange(row.id, val)}
                />
              ),
            },
          ]}
          isLoading={isLoading}
          loadingMessage="Memuat data siswa..."
          emptyMessage="Belum ada siswa"
          keyExtractor={(s) => s.id}
        />

        <div className="flex justify-end">
          <Button onClick={handlePromote} disabled={students.length === 0}>
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>
  );
}
