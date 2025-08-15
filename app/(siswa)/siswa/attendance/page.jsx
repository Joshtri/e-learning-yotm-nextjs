// app/siswa/attendance/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CalendarCheck,
  Check, // Hadir
  Thermometer, // Sakit
  FileText, // Izin
  X, // Alpha
  CalendarDays, // icon sekadar hiasan block libur
} from "lucide-react";
import GreetingWidget from "@/components/GreetingWidget";

export default function StudentAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // table | calendar

  // === state libur bulan aktif (mengikuti bulan yang terlihat di kalender) ===
  const [activeMonthDate, setActiveMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [monthHolidays, setMonthHolidays] = useState([]); // array {date,name,kind,source}
  const [isHolidayLoading, setIsHolidayLoading] = useState(true);

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

  // ambil libur bulan aktif dari /api/holidays (gabungan date-holidays + DB)
  const fetchMonthHolidays = async (d) => {
    const y = d.getFullYear();
    const m = d.getMonth() + 1; // 1..12
    setIsHolidayLoading(true);
    try {
      const res = await fetch(`/api/holidays/combined?year=${y}&month=${m}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!json?.success)
        throw new Error(json?.message || "Gagal memuat hari libur");
      setMonthHolidays(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat hari libur bulan ini");
      setMonthHolidays([]);
    } finally {
      setIsHolidayLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);
  useEffect(() => {
    fetchMonthHolidays(activeMonthDate);
  }, [activeMonthDate]);

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
    { header: "Keterangan", accessorKey: "keterangan" },
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
          !!row.attendanceStatus && row.attendanceStatus !== "ABSENT";
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

  // --- penandaan kalender ---
  const markedStatusByDate = sessions.reduce((acc, s) => {
    acc[new Date(s.tanggal).toDateString()] = s.attendanceStatus;
    return acc;
  }, {});

  const holidayMap = useMemo(() => {
    const m = {};
    (monthHolidays || []).forEach((h) => {
      const key = new Date(h.date).toDateString();
      if (!m[key]) m[key] = [];
      m[key].push(h.name);
    });
    return m;
  }, [monthHolidays]);

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;

    const status = markedStatusByDate[date.toDateString()];
    const holidayNames = holidayMap[date.toDateString()];

    return (
      <div className="mt-1 flex flex-col items-center gap-0.5">
        {status ? <StatusIcon status={status} className="h-3 w-3" /> : null}
        {holidayNames ? (
          <span
            className="text-[10px] leading-none text-rose-600"
            title={holidayNames.join(", ")}
          >
            Libur
          </span>
        ) : null}
      </div>
    );
  };

  // daftar libur bulan ini (digroup per tanggal)
  const holidayList = useMemo(() => {
    const map = new Map();
    (monthHolidays || []).forEach((h) => {
      const key = h.date;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(h.name);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, namesSet]) => ({ date, names: Array.from(namesSet) }));
  }, [monthHolidays]);

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

      {/* Info libur bulan ini */}
      <div className="rounded border p-4">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="h-5 w-5 text-rose-600" />
          <h3 className="font-medium">
            Hari Libur{" "}
            {activeMonthDate.toLocaleString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </h3>
        </div>

        {isHolidayLoading ? (
          <div className="text-sm text-muted-foreground">Memuat libur…</div>
        ) : holidayList.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Tidak ada libur di bulan ini.
          </div>
        ) : (
          <ul className="text-sm space-y-1">
            {holidayList.map((h) => (
              <li key={h.date} className="flex gap-2">
                <span className="w-[110px] shrink-0">
                  {new Date(h.date).toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <span className="text-foreground">{h.names.join(", ")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

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
            value={activeMonthDate}
            onActiveStartDateChange={({ activeStartDate }) => {
              // aktif kalau pengguna geser bulan di kalender
              if (activeStartDate)
                setActiveMonthDate(new Date(activeStartDate));
            }}
            calendarType="iso8601"
            locale="id-ID"
            tileContent={tileContent}
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
            <span className="inline-flex items-center gap-1 mr-3">
              <X className="h-4 w-4 text-rose-500" /> Alpha
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-rose-600" />{" "}
              Libur
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
