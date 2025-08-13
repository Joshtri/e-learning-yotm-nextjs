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

export default function AttendancePerClassPage() {
  const { classId } = useParams();
  const router = useRouter();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // helper: normalisasi tanggal ke 00:00
  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const isSameDay = (a, b) =>
    startOfDay(a).getTime() === startOfDay(b).getTime();

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

  // ====== WIDGET DATA ======
  const today = useMemo(() => startOfDay(new Date()), []);
  const monthName = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      }),
    []
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
                  {lastSession
                    ? new Date(lastSession.tanggal).toLocaleDateString("id-ID")
                    : "-"}
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
                  <TableHead className="min-w-[140px]">Tahun Ajaran</TableHead>
                  <TableHead className="min-w-[220px]">Keterangan</TableHead>
                  <TableHead className="w-[120px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
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
                            <span>
                              {new Date(session.tanggal).toLocaleDateString(
                                "id-ID"
                              )}
                            </span>
                            {isTodayRow && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                Hari ini
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
              Baris dengan label <strong>“Hari ini”</strong> menandakan sesi
              presensi yang aktif hari ini.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
