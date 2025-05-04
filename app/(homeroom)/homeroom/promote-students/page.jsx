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
  const [academicYear, setAcademicYear] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [className, setClassName] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/homeroom/my-students-for-promotion");
      const { students, academicYear, className } = res.data.data || {};
      setStudents(students || []);
      setAcademicYear(academicYear || null);
      setClassName(className || "");
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

      {className && (
        <p className="text-sm text-muted-foreground mt-1">Kelas: {className}</p>
      )}

      {academicYear && (
        <p className="text-sm text-muted-foreground mt-2">
          Tahun Ajaran: {academicYear.tahunMulai}/{academicYear.tahunSelesai}
        </p>
      )}

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
              header: "Hadir",
              cell: (row) => row.attendanceSummary?.hadir ?? "-",
            },
            {
              header: "Sakit",
              cell: (row) => row.attendanceSummary?.sakit ?? "-",
            },
            {
              header: "Izin",
              cell: (row) => row.attendanceSummary?.izin ?? "-",
            },
            {
              header: "Alpa",
              cell: (row) => row.attendanceSummary?.alpa ?? "-",
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
