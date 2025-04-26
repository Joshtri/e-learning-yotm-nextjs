// app/(student)/attendance/page.jsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarCheck, FileText } from "lucide-react";
import api from "@/lib/axios";

export default function StudentAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/student/attendance/sessions");
      setSessions(res.data.data || []);
    } catch (error) {
      console.error("Gagal memuat sesi presensi:", error);
      toast.error("Gagal memuat sesi presensi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSubmitAttendance = async (sessionId, status) => {
    try {
      await api.post(`/student/attendance/${sessionId}`, { status });
      toast.success("Presensi berhasil!");
      fetchSessions(); // Refresh list
    } catch (error) {
      console.error("Gagal submit presensi:", error);
      const message =
        error?.response?.data?.message || "Gagal mengisi presensi";
      toast.error(message);
    }
  };

  const columns = [
    {
      header: "Tanggal",
      accessorKey: "tanggal",
      cell: (row) => new Date(row.tanggal).toLocaleDateString("id-ID"),
    },
    {
      header: "Kelas",
      accessorKey: "class.namaKelas",
      cell: (row) => row.class?.namaKelas || "-",
    },
    {
      header: "Keterangan",
      accessorKey: "keterangan",
      cell: (row) => row.keterangan || "-",
    },
    {
      header: "Status Presensi",
      cell: (row) => {
        if (row.attendanceStatus) {
          let label = "";
          switch (row.attendanceStatus) {
            case "PRESENT":
              label = "Hadir ✅";
              break;
            case "SICK":
              label = "Sakit 🤒";
              break;
            case "EXCUSED":
              label = "Izin 📄";
              break;
            default:
              label = "Sudah Presensi";
          }
          return (
            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {label}
            </span>
          );
        }
        return "-";
      },
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={!!row.attendanceStatus}
            onClick={() => handleSubmitAttendance(row.id, "PRESENT")}
          >
            Hadir
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!!row.attendanceStatus}
            onClick={() => handleSubmitAttendance(row.id, "SICK")}
          >
            Sakit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!!row.attendanceStatus}
            onClick={() => handleSubmitAttendance(row.id, "EXCUSED")}
          >
            Izin
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Presensi Hari Ini"
        description="Lakukan presensi untuk sesi yang tersedia."
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Presensi" },
        ]}
        icon={<CalendarCheck className="h-6 w-6" />}
      />

      <div className="border rounded-lg overflow-hidden">
        <DataTable
          data={sessions}
          columns={columns}
          isLoading={isLoading}
          loadingMessage="Memuat sesi presensi..."
          emptyMessage="Tidak ada sesi presensi hari ini."
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}
