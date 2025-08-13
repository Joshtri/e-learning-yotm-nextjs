"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CalendarCheck,
  Check, // ✅ Hadir
  Thermometer, // 🤒 Sakit
  FileText, // 📄 Izin
  X, // ❌ Absent
} from "lucide-react";
import GreetingWidget from "@/components/GreetingWidget";

export default function StudentAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // table or calendar

  // ---------- ICONS ----------
  const StatusIcon = ({ status, className = "h-4 w-4" }) => {
    switch (status) {
      case "PRESENT":
        return (
          <Check className={`${className} text-green-600`} aria-label="Hadir" />
        );
      case "SICK":
        return (
          <Thermometer
            className={`${className} text-yellow-600`}
            aria-label="Sakit"
          />
        );
      case "EXCUSED":
        return (
          <FileText
            className={`${className} text-blue-600`}
            aria-label="Izin"
          />
        );
      case "ABSENT":
        return (
          <X className={`${className} text-rose-500`} aria-label="Alpha" />
        );
      default:
        return <span>-</span>;
    }
  };

  const isSameDay = (a, b) => {
    const da = new Date(a);
    da.setHours(0, 0, 0, 0);
    const db = new Date(b);
    db.setHours(0, 0, 0, 0);
    return da.getTime() === db.getTime();
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get("/student/attendance/sessions");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // ✅ hanya sesi HARI INI
      const onlyToday = (res.data?.data || []).filter((s) =>
        isSameDay(s.tanggal, today)
      );

      setSessions(onlyToday);
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
      const res = await api.post(`/student/attendance/${sessionId}`, {
        status,
      });
      toast.success(res.data.message || "Presensi berhasil!");
      fetchSessions();
    } catch (error) {
      const msg = error.response?.data?.message || "Gagal mengisi presensi";
      toast.error(msg);
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
      cell: (row) =>
        row.attendanceStatus ? (
          <StatusIcon status={row.attendanceStatus} />
        ) : (
          "-"
        ),
    },
    {
      header: "Aksi",
      cell: (row) => {
        const alreadyFinal =
          !!row.attendanceStatus && row.attendanceStatus !== "ABSENT"; // hanya disable jika sudah final

        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={alreadyFinal}
              onClick={() => handleSubmitAttendance(row.id, "PRESENT")}
            >
              Hadir
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={alreadyFinal}
              onClick={() => handleSubmitAttendance(row.id, "SICK")}
            >
              Sakit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={alreadyFinal}
              onClick={() => handleSubmitAttendance(row.id, "EXCUSED")}
            >
              Izin
            </Button>
          </div>
        );
      },
    },
  ];

  // Kalender tetap ada: dengan data “onlyToday”, yang ditandai cuma tanggal hari ini
  const markedDates = sessions.reduce((acc, s) => {
    acc[new Date(s.tanggal).toDateString()] = s.attendanceStatus;
    return acc;
  }, {});

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const status = markedDates[date.toDateString()];
    return status ? <StatusIcon status={status} className="h-3 w-3" /> : null;
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
      <GreetingWidget />

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
          emptyMessage="Tidak ada sesi presensi hari ini."
          keyExtractor={(item) => item.id}
        />
      ) : (
        <div className="rounded border p-4">
          <Calendar
            tileContent={tileContent}
            calendarType="iso8601"
            locale="id-ID"
          />
          <div className="mt-4 text-sm text-muted-foreground">
            <strong>Keterangan:</strong>{" "}
            <span className="inline-flex items-center gap-1 mr-3">
              <Check className="h-4 w-4 text-green-600" /> Hadir
            </span>
            <span className="inline-flex items-center gap-1 mr-3">
              <Thermometer className="h-4 w-4 text-yellow-600" /> Sakit
            </span>
            <span className="inline-flex items-center gap-1 mr-3">
              <FileText className="h-4 w-4 text-blue-600" /> Izin
            </span>
            <span className="inline-flex items-center gap-1">
              <X className="h-4 w-4 text-rose-500" /> Alpha
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
