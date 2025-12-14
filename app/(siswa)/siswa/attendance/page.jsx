// app/siswa/attendance/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CalendarCheck,
  Check, // Hadir
  Thermometer, // Sakit
  FileText, // Izin
  X, // Alpha
  CalendarDays, // icon sekadar hiasan block libur
  BookOpen,
  User,
  Clock,
} from "lucide-react";
import GreetingWidget from "@/components/GreetingWidget";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StudentAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // list (accordion) | calendar
  const [classInfo, setClassInfo] = useState(null);
  const [submittingSessionId, setSubmittingSessionId] = useState(null);

  const fetchClassInfo = async () => {
    try {
      const res = await api.get("/student/my-class");
      setClassInfo(res.data.data);
    } catch (error) {
      console.error("Gagal memuat info kelas:", error);
      toast.error("Gagal memuat informasi kelas");
    }
  };

  useEffect(() => {
    fetchClassInfo();
  }, []);

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
        return <span className="text-gray-400">-</span>;
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get("/student/attendance/sessions");
      setSessions(res.data?.data || []);
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
      setSubmittingSessionId(sessionId);
      const res = await api.post(`/student/attendance/${sessionId}`, {
        status,
      });
      toast.success(res.data.message || "Presensi berhasil!");
      await fetchSessions();
    } catch (error) {
      const msg = error.response?.data?.message || "Gagal mengisi presensi";
      toast.error(msg);
    } finally {
      setSubmittingSessionId(null);
    }
  };

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

  // Group Sessions by Subject
  const groupedSessions = useMemo(() => {
    return sessions.reduce((acc, session) => {
      const name = session.subjectName || "Lainnya";
      if (!acc[name]) {
        acc[name] = {
          subjectName: name,
          tutorName: session.tutorName,
          sessions: [],
        };
      }
      acc[name].sessions.push(session);
      return acc;
    }, {});
  }, [sessions]);

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
        description="Lihat dan isi presensi per mata pelajaran"
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Presensi" },
        ]}
        icon={<CalendarCheck className="h-6 w-6" />}
      />
      <GreetingWidget />

      {classInfo && (
        <div className="rounded border p-4 bg-white/50">
          <h3 className="font-medium mb-2">Informasi Kelas</h3>
          <p className="text-sm text-muted-foreground">
            Tahun Ajaran:{" "}
            <span className="text-foreground font-semibold">
              {classInfo.academicYear?.tahunMulai}/
              {classInfo.academicYear?.tahunSelesai}
            </span>{" "}
            • Semester:{" "}
            <span className="text-foreground font-semibold">
              {classInfo.academicYear?.semester}
            </span>
          </p>
        </div>
      )}

      {/* Info libur bulan ini */}
      <div className="rounded border p-4 bg-white/50">
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
                <span className="w-[110px] shrink-0 font-medium">
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
          onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
          variant="outline"
        >
          {viewMode === "list" ? "Tampilan Kalender" : "Tampilan Daftar"}
        </Button>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-4">
          <Accordion type="multiple" className="space-y-4">
            {Object.values(groupedSessions).map((group) => (
              <AccordionItem
                key={group.subjectName}
                value={group.subjectName}
                className="border rounded-lg bg-white shadow-sm px-4"
              >
                <div className="flex items-center justify-between py-4">
                  <AccordionTrigger className="hover:no-underline py-0 flex-1">
                    <div className="flex items-center gap-4 text-left">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          {group.subjectName}
                        </h3>
                        <p className="text-sm text-gray-500 font-normal flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {group.tutorName}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {group.sessions.length} Sesi
                      </Badge>
                    </div>
                  </AccordionTrigger>
                </div>

                <AccordionContent className="pt-2 pb-6 px-1">
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[100px]">Pertemuan</TableHead>
                          <TableHead>Tanggal & Waktu</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead>Status Saya</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.sessions.map((session) => {
                          const isFinal =
                            !!session.attendanceStatus &&
                            session.attendanceStatus !== "ABSENT";
                          const isSubmitting =
                            submittingSessionId === session.id;
                          // Allow update if session is started (DIMULAI) OR users can fill regardless if policy allows.
                          // Usually students can only fill if session is open.
                          // Assuming backend validation handles "isOpen".
                          // Frontend just checks if already marked.

                          // Optional: Check session.status === 'DIMULAI' before allowing input?
                          const canFill =
                            session.status === "DIMULAI" && !isFinal;

                          return (
                            <TableRow key={session.id}>
                              <TableCell>
                                <Badge variant="outline">
                                  Ke-{session.meetingNumber}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {new Date(session.tanggal).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {session.startTime
                                    ? new Date(
                                        session.startTime
                                      ).toLocaleTimeString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "-"}
                                </div>
                              </TableCell>
                              <TableCell>{session.keterangan || "-"}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <StatusIcon
                                    status={session.attendanceStatus}
                                    className="h-5 w-5"
                                  />
                                  <span className="text-sm font-medium">
                                    {session.attendanceStatus === "PRESENT"
                                      ? "Hadir"
                                      : session.attendanceStatus === "SICK"
                                      ? "Sakit"
                                      : session.attendanceStatus === "EXCUSED"
                                      ? "Izin"
                                      : session.attendanceStatus === "ABSENT"
                                      ? "Alpha"
                                      : "Belum Mengisi"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    disabled={!canFill || isSubmitting}
                                    className={`${
                                      canFill
                                        ? "bg-green-600 hover:bg-green-700"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      handleSubmitAttendance(
                                        session.id,
                                        "PRESENT"
                                      )
                                    }
                                  >
                                    Hadir
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!canFill || isSubmitting}
                                    onClick={() =>
                                      handleSubmitAttendance(session.id, "SICK")
                                    }
                                  >
                                    Sakit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={!canFill || isSubmitting}
                                    onClick={() =>
                                      handleSubmitAttendance(
                                        session.id,
                                        "EXCUSED"
                                      )
                                    }
                                  >
                                    Izin
                                  </Button>
                                </div>
                                {!canFill &&
                                  !isFinal &&
                                  session.status !== "DIMULAI" && (
                                    <div className="text-[10px] text-muted-foreground mt-1">
                                      Sesi belum dimulai / sudah selesai
                                    </div>
                                  )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            {Object.keys(groupedSessions).length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-slate-50">
                Tidak ada sesi presensi ditemukan.
              </div>
            )}
          </Accordion>
        </div>
      ) : (
        <div className="rounded border p-4 bg-white/50">
          <Calendar
            value={activeMonthDate}
            onActiveStartDateChange={({ activeStartDate }) => {
              if (activeStartDate)
                setActiveMonthDate(new Date(activeStartDate));
            }}
            calendarType="iso8601"
            locale="id-ID"
            tileContent={tileContent}
          />
          <div className="mt-4 text-sm text-muted-foreground bg-slate-50 p-3 rounded border">
            <strong>Keterangan:</strong>{" "}
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4 text-green-600" /> Hadir
              </span>
              <span className="inline-flex items-center gap-1">
                <Thermometer className="h-4 w-4 text-yellow-600" /> Sakit
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="h-4 w-4 text-blue-600" /> Izin
              </span>
              <span className="inline-flex items-center gap-1">
                <X className="h-4 w-4 text-rose-500" /> Alpha
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full bg-rose-600" />{" "}
                Libur
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
