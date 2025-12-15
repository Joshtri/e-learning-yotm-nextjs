"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  History,
  BookOpen,
  MoreHorizontal,
  Printer,
  Pencil,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const STATUS_COLORS = {
  TERJADWALKAN: "bg-blue-100 text-blue-700",
  DIMULAI: "bg-green-100 text-green-700",
  SELESAI: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS = {
  TERJADWALKAN: "Terjadwal",
  DIMULAI: "Berlangsung",
  SELESAI: "Selesai",
};
import { EmptyState } from "@/components/ui/empty-state";

// helpers
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const isSameDay = (a, b) => {
  const dateA = new Date(a).toISOString().split("T")[0];
  const dateB = new Date(b).toISOString().split("T")[0];
  return dateA === dateB;
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

  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId");
  const isHomeroom = searchParams.get("homeroom") === "true";

  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const sessions = useMemo(() => {
    let data = allSessions;
    if (subjectId) {
      data = data.filter((s) => s.subject?.id === subjectId);
    } else if (isHomeroom) {
      data = data.filter((s) => !s.subject);
    }
    // Sort ascending
    return data.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  }, [allSessions, subjectId, isHomeroom]);

  const handleUpdateStatus = async (sessionId, newStatus) => {
    try {
      const res = await api.patch(`/tutor/attendances/${sessionId}`, {
        status: newStatus,
      });
      if (res.data.success) {
        toast.success("Status berhasil diperbarui");
        setAllSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, ...res.data.data } : s))
        );
      }
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  // Edit Session Logic
  const [editDialog, setEditDialog] = useState({
    open: false,
    id: null,
    tanggal: "",
    startTime: "",
    endTime: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const openEditDialog = (s) => {
    // dayjs handles ISO strings well
    // format to YYYY-MM-DD for date input
    // format to HH:mm for time input

    // Safety check if date exists
    if (!s.tanggal) return;

    setEditDialog({
      open: true,
      id: s.id,
      tanggal: dayjs(s.tanggal).format("YYYY-MM-DD"),
      startTime: s.startTime ? dayjs(s.startTime).format("HH:mm") : "",
      endTime: s.endTime ? dayjs(s.endTime).format("HH:mm") : "",
    });
  };

  const handleSaveSession = async () => {
    try {
      setIsSaving(true);

      // Reconstruct dates
      // Base date from 'tanggal' input (YYYY-MM-DD)
      const baseDate = editDialog.tanggal;
      if (!baseDate) {
        toast.error("Tanggal wajib diisi");
        setIsSaving(false);
        return;
      }

      // Helper to combine base date + HH:mm -> ISO
      const toIso = (timeStr) => {
        if (!timeStr) return undefined;
        // dayjs(YYYY-MM-DD + " " + HH:mm) -> ISO
        return dayjs(`${baseDate} ${timeStr}`).toISOString();
      };

      const payload = {
        tanggal: dayjs(baseDate).toISOString(),
        startTime: toIso(editDialog.startTime),
        endTime: toIso(editDialog.endTime),
      };

      const res = await api.patch(
        `/tutor/attendances/${editDialog.id}`,
        payload
      );

      if (res.data.success) {
        toast.success("Sesi berhasil diperbarui");
        setAllSessions((prev) =>
          prev.map((s) =>
            s.id === editDialog.id ? { ...s, ...res.data.data } : s
          )
        );
        setEditDialog((prev) => ({ ...prev, open: false }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan perubahan");
    } finally {
      setIsSaving(false);
    }
  };

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
        setAllSessions(res.data.data || []);
      } catch {
        toast.error("Gagal memuat presensi kelas");
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
      } catch {
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

  const handlePrintRecap = async () => {
    try {
      if (!subjectId) {
        toast.error(
          "Fitur ini hanya tersedia untuk tampilan per mata pelajaran."
        );
        return;
      }

      const toastId = toast.loading("Menyiapkan laporan...", {
        duration: Infinity,
      });

      try {
        const res = await api.get(`/tutor/report/recap`, {
          params: { classId: classId, subjectId },
        });

        if (!res.data.success) throw new Error(res.data.message);

        const {
          className,
          subjectName,
          academicYear,
          semester,
          sessions,
          students,
          tutorName,
          programName,
        } = res.data.data;

        // Init PDF
        const doc = new jsPDF("landscape");

        // Load Logo
        try {
          const imgProps = await new Promise((resolve) => {
            const img = new Image();
            img.src = "/yotm_logo.png";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
          });

          if (imgProps) {
            // Add Logo (x: 14, y: 10, w: 20, h: 20)
            doc.addImage(imgProps, "PNG", 14, 10, 20, 20);
          }
        } catch (e) {
          console.warn("Logo load failed", e);
        }

        // Header
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("LAPORAN PRESENSI KELAS", 148, 15, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`${programName} - ${academicYear} (${semester})`, 148, 22, {
          align: "center",
        });

        // Meta Info
        doc.setFontSize(10);
        doc.text(`Mata Pelajaran : ${subjectName}`, 14, 35);
        doc.text(`Kelas          : ${className}`, 14, 40);
        doc.text(`Guru Pengajar  : ${tutorName}`, 14, 45);

        // Table Data
        const headRow = [
          "No",
          "NISN",
          "NAMA SISWA",
          ...sessions.map((s) => {
            const d = new Date(s.date);
            return d.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
          }),
        ];

        const bodyRows = students.map((s, i) => [
          i + 1,
          s.nisn || "-",
          s.name,
          ...s.statuses.map((st) => {
            // Map Status Enum (English) to Single Letter Code (Indonesian)
            const statusMap = {
              PRESENT: "H",
              SICK: "S",
              EXCUSED: "I",
              ABSENT: "A",
            };
            return statusMap[st] || st || "-";
          }),
        ]);

        // AutoTable
        autoTable(doc, {
          startY: 50,
          head: [headRow],
          body: bodyRows,
          theme: "grid",
          styles: {
            fontSize: 8,
            cellPadding: 1,
            halign: "center",
            valign: "middle",
            textColor: [0, 0, 0], // Default black
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            lineWidth: 0.1,
            lineColor: [0, 0, 0], // Black borders for header
          },
          columnStyles: {
            2: { halign: "left" }, // Nama Siswa Left Align
          },
          didParseCell: function (data) {
            // Check if we are in the body and not the first 3 columns (No, NISN, Name)
            if (data.section === "body" && data.column.index > 2) {
              const text = data.cell.text[0];
              data.cell.styles.fontStyle = "bold"; // Make status bold

              if (text === "H") {
                data.cell.styles.fillColor = [46, 204, 113]; // Green
                data.cell.styles.textColor = [255, 255, 255]; // White
              } else if (text === "S") {
                data.cell.styles.fillColor = [231, 76, 60]; // Red
                data.cell.styles.textColor = [255, 255, 255]; // White
              } else if (text === "A") {
                data.cell.styles.fillColor = [231, 76, 60]; // Red
                data.cell.styles.textColor = [255, 255, 255]; // White
              } else if (text === "I") {
                data.cell.styles.fillColor = [149, 165, 166]; // Gray
                data.cell.styles.textColor = [255, 255, 255]; // White
              }
            }
          },
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY + 15;

        // Check page break
        if (finalY > 180) {
          doc.addPage();
          // Reset Y ? No, precise positioning.
        }

        const dateStr = new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        doc.setFontSize(10);

        // Two columns signature
        // Left: Ketua Kelas (Placeholder?)
        // Right: Guru/Tutor

        doc.text("Mengetahui,", 220, finalY, { align: "center" });
        doc.text(`Kupang, ${dateStr}`, 220, finalY + 5, { align: "center" });
        doc.text("Guru Pengajar,", 220, finalY + 10, { align: "center" });

        doc.text(tutorName, 220, finalY + 35, { align: "center" });
        doc.line(200, finalY + 36, 240, finalY + 36); // Underline

        // Save
        doc.save(`Presensi_${className}_${subjectName}.pdf`);
        toast.dismiss(toastId);
        toast.success("Laporan berhasil diunduh");
      } catch (err) {
        toast.dismiss(toastId);
        toast.error("Gagal membuat laporan: " + err.message);
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <PageHeader
          title="Riwayat Presensi Kelas"
          description="Daftar sesi presensi untuk kelas ini."
          breadcrumbs={[
            { label: "Dashboard", href: "/tutor/dashboard" },
            { label: "Presensi", href: "/tutor/attendances" },
            { label: "Detail Kelas", active: true },
          ]}
        />
        <Button onClick={handlePrintRecap} variant="default">
          <Printer className="mr-2 h-4 w-4" />
          Cetak Laporan
        </Button>
      </div>

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

      {/* ====== TABEL SESI PER MAPEL ====== */}
      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Memuat Data Presensi...</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <EmptyState
          title="Tidak ada sesi presensi"
          description="Belum ada sesi presensi yang dibuat untuk kelas ini."
          icon={<CalendarCheck className="h-10 w-10 text-muted-foreground" />}
        />
      ) : (
        (() => {
          // Grouping Logic Inline
          const groups = {};
          sessions.forEach((s) => {
            const name = s.subject?.namaMapel || "Wali Kelas";
            if (!groups[name]) groups[name] = [];
            groups[name].push(s);
          });
          const subjectKeys = Object.keys(groups).sort();

          return (
            <div className="space-y-8">
              {subjectKeys.map((subjectName) => (
                <Card
                  key={subjectName}
                  className="border-l-4 border-l-blue-500 shadow-sm"
                >
                  <CardHeader className="pb-2 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-xl font-bold text-slate-800">
                        {subjectName}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent bg-slate-50/50 border-b-slate-200">
                            <TableHead className="min-w-[150px] pl-6">
                              Tanggal
                            </TableHead>
                            <TableHead className="min-w-[150px]">
                              Status
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Kehadiran
                            </TableHead>
                            <TableHead className="min-w-[150px]">
                              Keterangan
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Semester
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Pertemuan
                            </TableHead>
                            <TableHead className="w-[120px] text-right pr-6">
                              Aksi
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groups[subjectName].map((session) => {
                            const isTodayRow = isSameDay(
                              session.tanggal,
                              today
                            );
                            return (
                              <TableRow
                                key={session.id}
                                className={`
                                  hover:bg-blue-50/30 transition-colors
                                  ${isTodayRow ? "bg-blue-50/50" : ""}
                                `}
                              >
                                <TableCell className="pl-6 py-3">
                                  <div className="flex flex-col">
                                    <span
                                      className={`font-medium ${
                                        isTodayRow
                                          ? "text-blue-700"
                                          : "text-slate-700"
                                      }`}
                                    >
                                      {new Date(
                                        session.tanggal
                                      ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                      })}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(
                                        session.tanggal
                                      ).toLocaleDateString("id-ID", {
                                        weekday: "long",
                                      })}
                                      {(session.startTime ||
                                        session.endTime) && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border text-slate-600">
                                            {session.startTime
                                              ? new Date(
                                                  session.startTime
                                                ).toLocaleTimeString("id-ID", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })
                                              : "?"}
                                            <span className="mx-1 text-slate-400">
                                              &rarr;
                                            </span>
                                            {session.endTime
                                              ? new Date(
                                                  session.endTime
                                                ).toLocaleTimeString("id-ID", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })
                                              : "?"}
                                          </span>
                                        </div>
                                      )}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block ${
                                      STATUS_COLORS[session.status] ||
                                      "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {STATUS_LABELS[session.status] ||
                                      session.status}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {session.status === "SELESAI" ? (
                                    <span className="font-mono text-sm font-medium">
                                      {session.attendanceSummary || "-"}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-slate-600">
                                  {session.keterangan || "-"}
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                                    {session.academicYear?.semester || "-"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-xs font-bold text-slate-700 border">
                                    {session.meetingNumber || "#"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex justify-end gap-2 items-center">
                                    {isTodayRow && (
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          router.push(
                                            `/tutor/attendances/${session.id}`
                                          )
                                        }
                                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                      >
                                        Presensi
                                      </Button>
                                    )}

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                        >
                                          <span className="sr-only">
                                            Open menu
                                          </span>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>
                                          Ubah Status
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleUpdateStatus(
                                              session.id,
                                              "TERJADWALKAN"
                                            )
                                          }
                                        >
                                          Reset ke Terjadwal
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleUpdateStatus(
                                              session.id,
                                              "DIMULAI"
                                            )
                                          }
                                        >
                                          Mulai Sesi
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleUpdateStatus(
                                              session.id,
                                              "SELESAI"
                                            )
                                          }
                                        >
                                          Selesai
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            // prevent conflict with dropdown closing
                                            setTimeout(
                                              () => openEditDialog(session),
                                              100
                                            );
                                          }}
                                        >
                                          <Pencil className="mr-2 h-4 w-4" />{" "}
                                          Edit Sesi
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            router.push(
                                              `/tutor/attendances/${session.id}`
                                            )
                                          }
                                        >
                                          Detail & Presensi
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })()
      )}

      <Dialog
        open={editDialog.open}
        onOpenChange={(v) => setEditDialog((prev) => ({ ...prev, open: v }))}
        modal={true}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sesi Presensi</DialogTitle>
            <DialogDescription>
              Ubah tanggal dan jam sesi ini. Klik simpan untuk menerapkan
              perubahan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={editDialog.tanggal}
                onChange={(e) =>
                  setEditDialog({ ...editDialog, tanggal: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jam Mulai</Label>
                <Input
                  type="time"
                  value={editDialog.startTime}
                  onChange={(e) =>
                    setEditDialog({ ...editDialog, startTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Jam Selesai</Label>
                <Input
                  type="time"
                  value={editDialog.endTime}
                  onChange={(e) =>
                    setEditDialog({ ...editDialog, endTime: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setEditDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Batal
            </Button>
            <Button onClick={handleSaveSession} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
