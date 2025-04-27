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

export default function HomeroomAttendancePage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [daysInMonth, setDaysInMonth] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

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
      await api.post("/homeroom/attendance/generate", {
        bulan: currentMonth,
        tahun: currentYear,
      });
      toast.success("Presensi bulan ini berhasil digenerate");
      fetchAttendance();
    } catch (error) {
      console.error(error);
      toast.error("Gagal generate presensi");
    }
  };

  const handleDeleteAttendance = async () => {
    try {
      await api.delete(
        `/homeroom/attendance?bulan=${currentMonth}&tahun=${currentYear}`
      );
      toast.success("Presensi bulan ini berhasil dihapus");
      setModalOpen(false);
      fetchAttendance();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus presensi");
    }
  };

  const statusToIcon = (status) => {
    switch (status) {
      case "PRESENT":
        return "✔️";
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
          <Button onClick={handleGenerate}>Generate Presensi Bulan Ini</Button>

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
                <Button variant="destructive" onClick={handleDeleteAttendance}>
                  Hapus
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
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
                  className="text-center"
                >
                  Tidak ada data siswa
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{student.namaLengkap}</TableCell>
                  {daysInMonth.map((day) => {
                    const tanggal = dayjs(
                      new Date(currentYear, currentMonth - 1, day)
                    ).format("YYYY-MM-DD");
                    const attendance = student.Attendance.find(
                      (a) => dayjs(a.date).format("YYYY-MM-DD") === tanggal
                    );
                    return (
                      <TableCell key={day} className="text-center">
                        {attendance ? statusToIcon(attendance.status) : "-"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <hr/>
        {/* Keterangan Presensi */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Keterangan Presensi:</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span>✔️</span>
              <span>Hadir</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🤒</span>
              <span>Sakit</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📄</span>
              <span>Izin</span>
            </div>
            <div className="flex items-center gap-2">
              <span>❌</span>
              <span>Alpha (Tidak Hadir)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>-</span>
              <span>Tidak ada data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
