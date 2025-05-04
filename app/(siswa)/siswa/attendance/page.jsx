"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";

export default function StudentAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // table or calendar

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

  const statusLabel = (status) => {
    switch (status) {
      case "PRESENT":
        return "✅";
      case "SICK":
        return "🤒";
      case "EXCUSED":
        return "📄";
      case "ABSENT":
        return "❌";
      default:
        return "-";
    }
  };

  const handleSubmitAttendance = async (sessionId, status) => {
    try {
      await api.post(`/student/attendance/${sessionId}`, { status });
      toast.success("Presensi berhasil!");
      fetchSessions();
    } catch (error) {
      toast.error("Gagal mengisi presensi");
    }
  };

  const columns = [
    {
      header: "Tanggal",
      accessorKey: "tanggal",
      cell: (row) => new Date(row.tanggal).toLocaleDateString("id-ID"),
    },
    {
      header: "Keterangan",
      accessorKey: "keterangan",
    },
    {
      header: "Status Presensi",
      cell: (row) => {
        if (row.attendanceStatus) {
          return <span>{statusLabel(row.attendanceStatus)}</span>;
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

  const markedDates = sessions.reduce((acc, s) => {
    acc[new Date(s.tanggal).toDateString()] = s.attendanceStatus;
    return acc;
  }, {});

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const status = markedDates[date.toDateString()];
    return status ? <span>{statusLabel(status)}</span> : null;
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Presensi Siswa"
        description="Lihat dan isi presensi sesi harian"
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Presensi" },
        ]}
        icon={<CalendarCheck className="h-6 w-6" />}
      />

      <div className="flex justify-end">
        <Button
          onClick={() =>
            setViewMode(viewMode === "table" ? "calendar" : "table")
          }
        >
          {viewMode === "table" ? "Tampilan Kalender" : "Tampilan Tabel"}
        </Button>
      </div>

      {viewMode === "table" ? (
        <DataTable
          data={sessions}
          columns={columns}
          isLoading={isLoading}
          loadingMessage="Memuat sesi presensi..."
          emptyMessage="Tidak ada sesi presensi."
          keyExtractor={(item) => item.id}
        />
      ) : (
        <div className="rounded border p-4">
          <Calendar
            tileContent={tileContent}
            calendarType="iso8601" // ✅ Benar (pakai huruf kecil semua)
            locale="id-ID"
          />{" "}
          <div className="mt-4 text-sm text-muted-foreground">
            <strong>Keterangan:</strong> ✅ Hadir, 🤒 Sakit, 📄 Izin, ❌ Alpha
          </div>
        </div>
      )}
    </div>
  );
}
