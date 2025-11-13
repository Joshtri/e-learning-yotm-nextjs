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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Loader2,
  Check, // Hadir
  Thermometer, // Sakit
  FileText, // Izin
  X, // Alpha
  Minus, // Kosong
  Users,
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
  const [academicYearInfo, setAcademicYearInfo] = useState(null);

  // ✅ New state for academic year filter
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [isLoadingAcademicYears, setIsLoadingAcademicYears] = useState(true);

  // ✅ New state for dynamic attendance editing
  const [isEditMode, setIsEditMode] = useState(false); // Toggle edit mode on/off
  const [editedAttendances, setEditedAttendances] = useState({}); // Track changes {studentId-date: newStatus}
  const [hasChanges, setHasChanges] = useState(false); // Show save/cancel button
  const [isSaving, setIsSaving] = useState(false);

  // Set locale Indonesia untuk dayjs
  dayjs.locale("id");

  // Fetch academic years on mount
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (!isLoadingAcademicYears) {
      fetchAttendance();
    }
  }, [currentMonth, currentYear, selectedAcademicYearId, isLoadingAcademicYears]);

  const fetchAcademicYears = async () => {
    try {
      setIsLoadingAcademicYears(true);
      console.log("Fetching academic years...");
      const res = await api.get("/homeroom/academic-years");
      console.log("Academic years response:", res.data);
      const years = res.data.data || [];
      console.log("Academic years data:", years);
      setAcademicYears(years);

      // Set default to the active academic year (or the first one if no active)
      const activeYear = years.find((y) => y.isActive);
      console.log("Active year found:", activeYear);
      if (activeYear) {
        setSelectedAcademicYearId(activeYear.id);
      } else if (years.length > 0) {
        setSelectedAcademicYearId(years[0].id);
        console.log("No active year, using first:", years[0]);
      } else {
        console.log("No academic years found!");
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Gagal memuat data tahun ajaran");
    } finally {
      setIsLoadingAcademicYears(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      setAcademicYearInfo(null);

      // Build query string with optional academicYearId
      let queryString = `/homeroom/attendance?bulan=${currentMonth}&tahun=${currentYear}`;
      if (selectedAcademicYearId) {
        queryString += `&academicYearId=${selectedAcademicYearId}`;
      }

      const res = await api.get(queryString);
      const responseData = res.data.data || {};
      const studentData = responseData.students || [];
      setStudents(studentData);

      if (responseData.academicYearInfo) {
        setAcademicYearInfo(responseData.academicYearInfo);
      } else {
        setAcademicYearInfo(null);
      }

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
        academicYearId: selectedAcademicYearId,
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

      // Build query string with optional academicYearId
      let queryString = `/homeroom/attendance?bulan=${currentMonth}&tahun=${currentYear}`;
      if (selectedAcademicYearId) {
        queryString += `&academicYearId=${selectedAcademicYearId}`;
      }

      await api.delete(queryString);
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

  // ✅ Handle attendance status change
  const handleAttendanceChange = (studentId, date, newStatus) => {
    const key = `${studentId}-${date}`;
    const updatedEdits = { ...editedAttendances };

    // Get original attendance to compare
    const student = students.find((s) => s.id === studentId);
    const originalAttendance = student?.Attendance.find(
      (a) => dayjs(a.date).format("YYYY-MM-DD") === date
    );

    if (originalAttendance?.status === newStatus) {
      // If changing back to original, remove from edits
      delete updatedEdits[key];
    } else {
      // Track the change
      updatedEdits[key] = {
        attendanceId: originalAttendance?.id,
        studentId,
        date,
        status: newStatus,
      };
    }

    setEditedAttendances(updatedEdits);
    setHasChanges(Object.keys(updatedEdits).length > 0);
  };

  // ✅ Save all changes to API
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const changedAttendances = Object.values(editedAttendances);

      if (changedAttendances.length === 0) {
        toast.info("Tidak ada perubahan untuk disimpan");
        return;
      }

      await api.patch("/homeroom/attendance/update-bulk", {
        attendances: changedAttendances,
        academicYearId: selectedAcademicYearId,
      });

      toast.success(`${changedAttendances.length} presensi berhasil diperbarui`);
      setEditedAttendances({});
      setHasChanges(false);
      fetchAttendance(); // Refresh data
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message || "Gagal menyimpan perubahan presensi";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Cancel all changes
  const handleCancelChanges = () => {
    setEditedAttendances({});
    setHasChanges(false);
    setIsEditMode(false);
    toast.info("Perubahan dibatalkan");
  };

  // ✅ Exit edit mode and reset changes
  const handleExitEditMode = () => {
    if (hasChanges) {
      // If there are unsaved changes, show confirmation
      const confirmed = window.confirm(
        "Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin keluar dari mode edit?"
      );
      if (!confirmed) return;
    }
    setIsEditMode(false);
    setEditedAttendances({});
    setHasChanges(false);
  };

  // ✅ Get current status (from edits or original data)
  const getCurrentStatus = (studentId, date) => {
    const key = `${studentId}-${date}`;
    if (editedAttendances[key]) {
      return editedAttendances[key].status;
    }

    const student = students.find((s) => s.id === studentId);
    const attendance = student?.Attendance.find(
      (a) => dayjs(a.date).format("YYYY-MM-DD") === date
    );
    return attendance?.status;
  };

  // ✅ Mark all students as present on a specific date
  const handleMarkAllPresent = (date) => {
    const updatedEdits = { ...editedAttendances };
    let changesCount = 0;

    students.forEach((student) => {
      const key = `${student.id}-${date}`;
      const studentAttendance = student.Attendance.find(
        (a) => dayjs(a.date).format("YYYY-MM-DD") === date
      );

      // Only mark as present if not already present
      if (studentAttendance?.status !== "PRESENT") {
        updatedEdits[key] = {
          attendanceId: studentAttendance?.id,
          studentId: student.id,
          date,
          status: "PRESENT",
        };
        changesCount++;
      }
    });

    setEditedAttendances(updatedEdits);
    setHasChanges(Object.keys(updatedEdits).length > 0);

    if (changesCount > 0) {
      toast.success(`${changesCount} siswa ditandai hadir`);
    } else {
      toast.info("Semua siswa sudah ditandai hadir");
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

  // ✅ Dropdown status selector component using shadcn
  const StatusDropdown = ({ studentId, date }) => {
    const currentStatus = getCurrentStatus(studentId, date);
    const statusOptions = [
      { value: "PRESENT", label: "Hadir", icon: Check, color: "text-green-600" },
      { value: "SICK", label: "Sakit", icon: Thermometer, color: "text-amber-600" },
      { value: "EXCUSED", label: "Izin", icon: FileText, color: "text-blue-600" },
      { value: "ABSENT", label: "Alpha", icon: X, color: "text-red-600" },
    ];

    const selectedOption = statusOptions.find((opt) => opt.value === currentStatus);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            {selectedOption ? (
              <selectedOption.icon className={`h-4 w-4 ${selectedOption.color}`} />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-40">
          <DropdownMenuLabel>Pilih Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {statusOptions.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => handleAttendanceChange(studentId, date, opt.value)}
              className="cursor-pointer"
            >
              <opt.icon className={`mr-2 h-4 w-4 ${opt.color}`} />
              <span>{opt.label}</span>
              {currentStatus === opt.value && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Check if viewing active academic year
  const isViewingActiveYear = academicYears.find((y) => y.id === selectedAcademicYearId)?.isActive;

  const pageDescription = `${
    isViewingActiveYear ? "Kelola" : "Lihat"
  } presensi siswa bulan ${dayjs()
    .month(currentMonth - 1)
    .format("MMMM")} ${currentYear}. ${
    academicYearInfo
      ? `T.A ${academicYearInfo.tahunMulai}/${academicYearInfo.tahunSelesai} Semester ${academicYearInfo.semester}`
      : ""
  }${!isViewingActiveYear && academicYearInfo ? " (Arsip)" : ""}`;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Presensi Siswa"
        description={pageDescription}
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Presensi" },
        ]}
      />

      {/* ✅ Show save/cancel banner when in edit mode and there are changes */}
      {isEditMode && hasChanges && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-900">
              Anda memiliki {Object.keys(editedAttendances).length} perubahan presensi yang belum disimpan
            </p>
            <p className="text-sm text-blue-700">
              Klik "Simpan" untuk menyimpan perubahan atau "Batal" untuk membatalkan
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancelChanges}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      )}

      {/* ✅ Show info banner when viewing archived data */}
      {!isViewingActiveYear && academicYearInfo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">
                Mode Arsip - Hanya Lihat
              </p>
              <p className="text-sm text-amber-700">
                Anda sedang melihat data presensi dari tahun ajaran sebelumnya. Generate dan hapus presensi hanya tersedia untuk tahun ajaran aktif.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {/* ✅ Academic Year Filter */}
          {isLoadingAcademicYears ? (
            <div className="w-[220px] h-10 bg-gray-100 animate-pulse rounded-md" />
          ) : academicYears.length === 0 ? (
            <div className="w-[220px] h-10 px-3 py-2 border rounded-md bg-gray-50 text-sm text-muted-foreground flex items-center">
              Tidak ada tahun ajaran
            </div>
          ) : (
            <Select
              value={selectedAcademicYearId}
              onValueChange={(val) => setSelectedAcademicYearId(val)}
              disabled={isLoadingAcademicYears}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Pilih Tahun Ajaran" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    T.A {year.tahunMulai}/{year.tahunSelesai} - {year.semester}
                    {year.isActive && " (Aktif)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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
              {Array.from({ length: 10 }).map((_, idx) => {
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
          {/* ✅ Edit Presensi button (available for active academic year) */}
          {isViewingActiveYear && !isEditMode && students.length > 0 && (
            <Button
              onClick={() => setIsEditMode(true)}
              variant="outline"
              disabled={isGenerating || isDeleting}
            >
              Edit Presensi
            </Button>
          )}

          {/* ✅ Exit Edit Mode button */}
          {isEditMode && (
            <Button
              onClick={handleExitEditMode}
              variant="outline"
              disabled={isSaving}
            >
              Keluar Edit Mode
            </Button>
          )}

          {/* ✅ Only show generate/delete buttons for active academic year (when not in edit mode) */}
          {isViewingActiveYear && !isEditMode && (
            <>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || students.length === 0}
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGenerating ? "Mengenerate..." : "Generate Presensi Bulan Ini"}
              </Button>

              <AlertDialog open={modalOpen} onOpenChange={setModalOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={students.length === 0}>
                    Hapus Semua Presensi
                  </Button>
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
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border p-4">
          <Skeleton className="h-64 w-full" />
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          title="Tidak Ada Siswa"
          description="Tidak ada data siswa yang ditemukan di kelas Anda untuk periode ini. Anda dapat generate presensi jika data siswa sudah ada."
          icon={<Users className="h-12 w-12 text-muted-foreground" />}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama</TableHead>
                {daysInMonth.map((day) => {
                  const date = dayjs(
                    new Date(currentYear, currentMonth - 1, day)
                  );
                  const dayName = date.format("ddd"); // Nama hari singkat (Sen, Sel, Rab, etc.)
                  const isWeekend = date.day() === 0 || date.day() === 6; // Minggu atau Sabtu
                  const tanggal = date.format("YYYY-MM-DD");

                  return (
                    <TableHead
                      key={day}
                      className={`text-center min-w-[100px] ${
                        isWeekend ? "bg-red-50 text-red-700" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-medium">{dayName}</span>
                          <span className="text-sm">{day}</span>
                        </div>
                        {/* ✅ Hadir Semua button only in edit mode */}
                        {isEditMode && (
                          <Button
                            size="xs"
                            variant="outline"
                            className="text-xs h-6 px-2"
                            onClick={() => handleMarkAllPresent(tanggal)}
                          >
                            Hadir Semua
                          </Button>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {students.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell className="text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.namaLengkap}
                  </TableCell>
                  {daysInMonth.map((day) => {
                    const date = dayjs(
                      new Date(currentYear, currentMonth - 1, day)
                    );
                    const tanggal = date.format("YYYY-MM-DD");
                    const isWeekend = date.day() === 0 || date.day() === 6; // Minggu atau Sabtu
                    const attendance = student.Attendance.find(
                      (a) => dayjs(a.date).format("YYYY-MM-DD") === tanggal
                    );
                    const isEdited = editedAttendances[`${student.id}-${tanggal}`];

                    return (
                      <TableCell
                        key={day}
                        className={`text-center p-1 ${
                          isWeekend ? "bg-red-50" : ""
                        } ${isEdited ? "bg-yellow-50" : ""}`}
                      >
                        {isEditMode ? (
                          <StatusDropdown studentId={student.id} date={tanggal} />
                        ) : (
                          <div className="flex justify-center">
                            <StatusIcon status={attendance?.status} />
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
