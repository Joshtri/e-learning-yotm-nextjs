"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Eye,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  History,
  Info,
} from "lucide-react";

// helpers
const pad2 = (n) => String(n).padStart(2, "0");
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const isSameDay = (a, b) => {
  const dateA = new Date(a).toISOString().split('T')[0];
  const dateB = new Date(b).toISOString().split('T')[0];
  return dateA === dateB;
};
const toLocalISO = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
};
const formatID = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  const date = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const dow = d.toLocaleDateString("id-ID", { weekday: "long" });
  return `${date} (${dow})`;
};

export default function AttendancePerClassPage() {
  const { classId } = useParams();
  const router = useRouter();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // holidays (sekilas list bulan ini)
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1..12
  const [holidayList, setHolidayList] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get(`/tutor/attendances/class/${classId}`);
        setSessions(res.data.data || []);
      } catch (error) {
        console.error("Gagal memuat presensi kelas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [classId]);

  // fetch libur untuk bulan berjalan
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        setLoadingHolidays(true);
        const res = await fetch(
          `/api/holidays/combined?year=${currentYear}&month=${currentMonth}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (json?.success) {
          // sort by tanggal + nama
          const sorted = (json.data || []).sort(
            (a, b) =>
              a.date.localeCompare(b.date) ||
              String(a.name || "").localeCompare(String(b.name || ""))
          );
          setHolidayList(sorted);
        } else {
          setHolidayList([]);
        }
      } catch (e) {
        setHolidayList([]);
      } finally {
        setLoadingHolidays(false);
      }
    };
    loadHolidays();
  }, [currentYear, currentMonth]);

  // ====== WIDGET DATA ======
  const today = useMemo(() => startOfDay(new Date()), []);
  const monthName = useMemo(
    () =>
      now.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      }),
    [now]
  );

  const sessionsToday = useMemo(
    () => sessions.filter((s) => isSameDay(s.tanggal, today)),
    [sessions, today]
  );
  const hasToday = sessionsToday.length > 0;

  const totalThisMonth = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return sessions.filter(
      (s) => new Date(s.tanggal) >= start && new Date(s.tanggal) <= end
    ).length;
  }, [sessions]);

  const lastSession = useMemo(() => {
    if (!sessions.length) return null;
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
    );
    return sorted[0];
  }, [sessions]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Riwayat Presensi Kelas"
        description="Daftar sesi presensi untuk kelas ini."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Presensi", href: "/tutor/attendances" },
          { label: "Presensi Kelas" },
        ]}
      />

      {/* ====== SEKILAS LIBUR BULAN INI ====== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Libur Bulan Ini</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHolidays ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : holidayList.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Tidak ada libur pada bulan ini.
            </div>
          ) : (
            <ul className="space-y-2">
              {holidayList.map((h, idx) => (
                <li
                  key={`${h.date}-${h.name}-${idx}`}
                  className="flex items-center justify-between gap-3 border rounded-md px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{h.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatID(h.date)}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${
                      h.source === "national"
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : h.source === "range"
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : h.source === "day"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    }`}
                  >
                    {h.source === "national"
                      ? "Nasional"
                      : h.source === "range"
                      ? "Rentang"
                      : h.source === "day"
                      ? "Harian"
                      : "Mingguan"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 text-xs text-muted-foreground">
            Sumber: date-holidays & libur tambahan sistem.
          </div>
        </CardContent>
      </Card>

      {/* ====== WIDGET STRIP ====== */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Bulan berjalan</p>
                <p className="text-lg font-semibold">{monthName}</p>
              </div>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Total sesi bulan ini
                </p>
                <p className="text-2xl font-bold">{totalThisMonth}</p>
              </div>
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sesi hari ini</p>
                <p
                  className={`text-2xl font-bold ${
                    hasToday ? "text-blue-600" : ""
                  }`}
                >
                  {sessionsToday.length}
                </p>
              </div>
              <CalendarCheck
                className={`h-5 w-5 ${
                  hasToday ? "text-blue-600" : "text-muted-foreground"
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sesi terakhir</p>
                <p className="text-sm font-medium">
                  {lastSession ? (
                    <>
                      <div>
                        {new Date(lastSession.tanggal).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {new Date(lastSession.tanggal).toLocaleDateString(
                          "id-ID",
                          { weekday: "long" }
                        )}
                      </div>
                    </>
                  ) : (
                    "-"
                  )}
                </p>
              </div>
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== TABEL SESI ====== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Daftar Sesi Presensi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[120px]">Tanggal</TableHead>
                  <TableHead className="min-w-[180px]">Mata Pelajaran</TableHead>
                  <TableHead className="min-w-[140px]">Tahun Ajaran</TableHead>
                  <TableHead className="min-w-[220px]">Keterangan</TableHead>
                  <TableHead className="w-[160px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      Tidak ada sesi presensi
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => {
                    const isTodayRow = isSameDay(session.tanggal, today);

                    return (
                      <TableRow
                        key={session.id}
                        className={
                          isTodayRow
                            ? "bg-blue-50/60 hover:bg-blue-50/80 border-l-4 border-l-blue-500"
                            : ""
                        }
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span>
                                {new Date(session.tanggal).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(session.tanggal).toLocaleDateString(
                                  "id-ID",
                                  { weekday: "long" }
                                )}
                              </span>
                            </div>
                            {isTodayRow && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                Hari ini
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {session.subject?.namaMapel || "Homeroom"}
                            </span>
                            {session.tutor && (
                              <span className="text-xs text-muted-foreground">
                                oleh {session.tutor.user.nama}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {session.academicYear
                            ? `${session.academicYear.tahunMulai}/${session.academicYear.tahunSelesai}`
                            : "-"}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {session.keterangan || "-"}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/tutor/attendances/${session.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Lihat
                            </Button>

                            {isTodayRow && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/tutor/attendances/${session.id}`
                                  )
                                }
                                className="bg-blue-600 text-white hover:bg-blue-600/90"
                                title="Mulai/lanjutkan presensi hari ini"
                              >
                                Mulai Presensi
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Hint kecil */}
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>
              Daftar libur di atas hanya menampilkan libur bulan berjalan.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
