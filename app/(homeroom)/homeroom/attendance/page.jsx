"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import dayjs from "dayjs";
import {
  Loader2,
  Check, // Hadir
  Thermometer, // Sakit
  FileText, // Izin
  X, // Alpha
  Minus, // Kosong
} from "lucide-react";

export default function HomeroomAttendancePage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [daysInMonth, setDaysInMonth] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [currentMonth, currentYear]);

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(
        `/homeroom/attendance?bulan=${currentMonth}&tahun=${currentYear}`
      );
      setStudents(res.data.data || []);

      const days = Array.from(
        { length: new Date(currentYear, currentMonth, 0).getDate() },
        (_, i) => i + 1
      );
      setDaysInMonth(days);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data presensi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      await api.post("/homeroom/attendance/generate", {
        bulan: currentMonth,
        tahun: currentYear,
      });
      toast.success("Presensi bulan ini berhasil digenerate");
      fetchAttendance();
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message || "Gagal generate presensi";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteAttendance = async () => {
    try {
      setIsDeleting(true);
      await api.delete(
        `/homeroom/attendance?bulan=${currentMonth}&tahun=${currentYear}`
      );
      toast.success("Presensi bulan ini berhasil dihapus");
      setModalOpen(false);
      fetchAttendance();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus presensi");
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------- STATUS ICON ----------
  const StatusIcon = ({ status, className = "h-4 w-4" }) => {
    const base = "inline-flex items-center justify-center";
    switch (status) {
      case "PRESENT":
        return (
          <Check
            className={`${className} text-green-600 ${base}`}
            aria-label="Hadir"
          />
        );
      case "SICK":
        return (
          <Thermometer
            className={`${className} text-amber-600 ${base}`}
            aria-label="Sakit"
          />
        );
      case "EXCUSED":
        return (
          <FileText
            className={`${className} text-blue-600 ${base}`}
            aria-label="Izin"
          />
        );
      case "ABSENT":
        return (
          <span
            className="inline-flex items-center justify-center rounded-full bg-red-100 p-1"
            title="Alpha"
          >
            <X className={`${className} text-red-600`} aria-label="Alpha" />
          </span>
        );
      default:
        return (
          <Minus
            className={`${className} text-muted-foreground ${base}`}
            aria-label="Tidak ada data"
          />
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Presensi Siswa"
        description={`Kelola presensi siswa bulan ${dayjs()
          .month(currentMonth - 1)
          .format("MMMM")} ${currentYear}.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Presensi" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <Select
            value={String(currentMonth)}
            onValueChange={(val) => setCurrentMonth(Number(val))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, idx) => (
                <SelectItem key={idx + 1} value={String(idx + 1)}>
                  {dayjs().month(idx).format("MMMM")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(currentYear)}
            onValueChange={(val) => setCurrentYear(Number(val))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }).map((_, idx) => {
                const year = new Date().getFullYear() - 2 + idx;
                return (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? "Mengenerate..." : "Generate Presensi Bulan Ini"}
          </Button>

          <AlertDialog open={modalOpen} onOpenChange={setModalOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Hapus Semua Presensi</Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus semua data presensi bulan ini?
                Ini tidak bisa dikembalikan.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAttendance}
                  disabled={isDeleting}
                >
                  {isDeleting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isDeleting ? "Menghapus..." : "Hapus"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">No</TableHead>
              <TableHead>Nama</TableHead>
              {daysInMonth.map((day) => (
                <TableHead key={day} className="text-center">
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={daysInMonth.length + 2}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={daysInMonth.length + 2}
                  className="text-center text-muted-foreground"
                >
                  Tidak ada data siswa
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell className="text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.namaLengkap}
                  </TableCell>
                  {daysInMonth.map((day) => {
                    const tanggal = dayjs(
                      new Date(currentYear, currentMonth - 1, day)
                    ).format("YYYY-MM-DD");
                    const attendance = student.Attendance.find(
                      (a) => dayjs(a.date).format("YYYY-MM-DD") === tanggal
                    );
                    return (
                      <TableCell key={day} className="text-center">
                        <StatusIcon status={attendance?.status} />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Keterangan Presensi:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5">
            <Check className="h-4 w-4 text-green-600" />
            <span>Hadir</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5">
            <Thermometer className="h-4 w-4 text-amber-600" />
            <span>Sakit</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Izin</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5">
            <X className="h-4 w-4 text-rose-600" />
            <span>Alpha (Tidak Hadir)</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5">
            <Minus className="h-4 w-4 text-muted-foreground" />
            <span>Tidak ada data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
