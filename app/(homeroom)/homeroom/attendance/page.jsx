"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { id } from "date-fns/locale";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Trash2,
  User,
  Printer,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

dayjs.locale("id");

const STATUS_COLORS = {
  TERJADWALKAN: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  DIMULAI: "bg-green-100 text-green-700 hover:bg-green-100",
  SELESAI: "bg-gray-100 text-gray-700 hover:bg-gray-100",
};

const STATUS_LABELS = {
  TERJADWALKAN: "Terjadwal",
  DIMULAI: "Sedang Berlangsung",
  SELESAI: "Selesai",
};

export default function HomeroomAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [className, setClassName] = useState("");

  // Generate Modal State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateStartDate, setGenerateStartDate] = useState(undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastFetchedYearId, setLastFetchedYearId] = useState(null);

  // Status Update State
  const [updatingSessionId, setUpdatingSessionId] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedSessionForStatus, setSelectedSessionForStatus] =
    useState(null);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedAcademicYearId) {
      fetchSessions();
    }
  }, [selectedAcademicYearId]);

  useEffect(() => {
    if (isGenerateOpen && selectedAcademicYearId) {
      fetchSubjects();
    }
  }, [isGenerateOpen, selectedAcademicYearId]);

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/homeroom/academic-years");
      const years = res.data.data || [];
      setAcademicYears(years);

      const activeYear = years.find((y) => y.isActive);
      if (activeYear) {
        setSelectedAcademicYearId(activeYear.id);
      } else if (years.length > 0) {
        setSelectedAcademicYearId(years[0].id);
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Gagal memuat data tahun ajaran");
    }
  };

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(
        `/homeroom/attendance?academicYearId=${selectedAcademicYearId}`
      );
      if (res.data.success) {
        setSessions(res.data.data.sessions || []);
        setClassName(res.data.data.className);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat sesi presensi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    // Cache check
    if (lastFetchedYearId === selectedAcademicYearId) return;

    try {
      setIsLoadingSubjects(true);
      const res = await api.get(
        `/homeroom/subjects?academicYearId=${selectedAcademicYearId}`
      );
      if (res.data.success) {
        setSubjects(res.data.data);
        setLastFetchedYearId(selectedAcademicYearId);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat daftar mata pelajaran");
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const handleGenerate = async () => {
    if (!generateStartDate) {
      toast.error("Pilih tanggal mulai pertemuan 1");
      return;
    }
    if (!selectedSubjectId) {
      toast.error("Pilih Mata Pelajaran");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await api.post("/homeroom/attendance/generate", {
        academicYearId: selectedAcademicYearId,
        startDate: generateStartDate
          ? dayjs(generateStartDate).format("YYYY-MM-DD")
          : "",
        classSubjectTutorId: selectedSubjectId,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsGenerateOpen(false);
        fetchSessions();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Gagal generate presensi");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      setUpdatingSessionId(sessionId);
      await api.patch(`/homeroom/attendance/${sessionId}`, {
        status: "DIMULAI",
      });
      toast.success("Sesi dimulai! Silakan input presensi.");
      fetchSessions(); // Refresh list to update status and buttons
    } catch (error) {
      console.error(error);
      toast.error("Gagal memulai sesi");
    } finally {
      setUpdatingSessionId(null);
    }
  };

  const openStatusDialog = (session) => {
    setSelectedSessionForStatus(session);
    setNewStatus(session.status);
    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedSessionForStatus) return;

    try {
      setUpdatingSessionId(selectedSessionForStatus.id);
      await api.patch(`/homeroom/attendance/${selectedSessionForStatus.id}`, {
        status: newStatus,
      });
      toast.success("Status sesi berhasil diperbarui");
      setStatusDialogOpen(false);
      fetchSessions();
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui status sesi");
    } finally {
      setUpdatingSessionId(null);
    }
  };

  // Delete State
  const [deleteSubjectId, setDeleteSubjectId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSubjectSessions = async () => {
    if (!deleteSubjectId) return;
    try {
      setIsDeleting(true);
      await api.delete(
        `/homeroom/attendance?subjectId=${deleteSubjectId}&academicYearId=${selectedAcademicYearId}`
      );
      toast.success("Semua sesi untuk mata pelajaran ini berhasil dihapus.");
      fetchSessions();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus sesi.");
    } finally {
      setIsDeleting(false);
      setDeleteSubjectId(null);
    }
  };

  const handlePrintRecap = async (subjectId) => {
    const classId = sessions.length > 0 ? sessions[0].classId : null;
    if (!classId) {
      toast.error("Data kelas tidak ditemukan");
      return;
    }

    try {
      const toastId = toast.loading("Menyiapkan laporan...", {
        duration: Infinity,
      });

      try {
        const res = await api.get(`/tutor/report/recap`, {
          params: { classId, subjectId },
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
            return `${d.getDate()}/${d.getMonth() + 1}`;
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
      <PageHeader
        title={`Daftar Sesi Presensi - ${className || "Loading..."}`}
        description="Kelola sesi presensi mata pelajaran per pertemuan"
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Presensi" },
        ]}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="w-32">Tahun Ajaran:</Label>
          <Select
            value={selectedAcademicYearId}
            onValueChange={setSelectedAcademicYearId}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.tahunMulai}/{year.tahunSelesai} - {year.semester}
                  {year.isActive && " (Aktif)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogTrigger asChild>
            <Button>Generate Presensi Semester</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Presensi Semester</DialogTitle>
              <DialogDescription>
                Pilih Mata Pelajaran dan Tanggal Mulai untuk membuat 16 sesi
                presensi.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Select
                  value={selectedSubjectId}
                  onValueChange={setSelectedSubjectId}
                  disabled={isLoadingSubjects}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingSubjects ? "Memuat..." : "Pilih Mapel - Tutor"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.subjectName} - {sub.tutorName}{" "}
                        {!sub.hasSchedule && "(Belum Ada Jadwal)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hanya mapel dengan jadwal yang dapat dipilih.
                </p>
                {selectedSubjectId &&
                  (() => {
                    const sub = subjects.find(
                      (s) => s.id === selectedSubjectId
                    );
                    if (sub?.scheduleDays?.length > 0) {
                      const days = [
                        "",
                        "Senin",
                        "Selasa",
                        "Rabu",
                        "Kamis",
                        "Jumat",
                        "Sabtu",
                        "Minggu",
                      ];
                      const dayNames = sub.scheduleDays
                        .map((d) => days[d])
                        .join(", ");
                      return (
                        <div className="mt-2 p-3 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200 flex items-start gap-2">
                          <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold">Jadwal Roster:</p>
                            <p>Hari {dayNames}.</p>
                            <p className="text-xs text-blue-600 mt-1">
                              *Kalender otomatis hanya mengaktifkan tanggal
                              sesuai jadwal.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
              </div>

              <div className="space-y-2">
                <Label>Tanggal Mulai Pertemuan 1</Label>
                <div className="border rounded-md p-4 flex flex-col items-center justify-center">
                  <div className="mb-4 text-sm font-medium text-center border-b pb-2 w-full">
                    {generateStartDate ? (
                      <span className="text-blue-600">
                        {dayjs(generateStartDate).format("dddd, DD MMMM YYYY")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Silakan pilih tanggal di bawah
                      </span>
                    )}
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={generateStartDate}
                    onSelect={setGenerateStartDate}
                    className="rounded-md border shadow-sm"
                    disabled={(date) => {
                      if (!selectedSubjectId) return false;
                      const sub = subjects.find(
                        (s) => s.id === selectedSubjectId
                      );
                      if (
                        !sub ||
                        !sub.scheduleDays ||
                        sub.scheduleDays.length === 0
                      )
                        return false;

                      const day = date.getDay() || 7;
                      return !sub.scheduleDays.includes(day);
                    }}
                    locale={id}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Pilih tanggal dimulainya minggu pertama. Hanya tanggal sesuai
                  jadwal yang aktif.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsGenerateOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isGenerating ? "Processing..." : "Generate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          title="Belum Ada Sesi"
          description="Klik tombol Generate untuk membuat sesi presensi semester ini."
          icon={<CalendarIcon className="h-12 w-12 text-muted-foreground" />}
        />
      ) : (
        <div className="">
          <Accordion type="multiple" className="space-y-4">
            {Object.values(
              sessions.reduce((acc, session) => {
                const key = session.subjectId || session.subject?.id;
                if (!key) return acc;

                if (!acc[key]) {
                  acc[key] = {
                    subjectId: key,
                    subjectName: session.subject?.namaMapel || "Mata Pelajaran",
                    tutorName: session.tutor?.namaLengkap || "-",
                    sessions: [],
                  };
                }
                acc[key].sessions.push(session);
                return acc;
              }, {})
            ).map((group) => (
              <AccordionItem
                key={group.subjectId}
                value={group.subjectId}
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
                      <Badge variant="outline" className="ml-2">
                        {group.sessions.length} Sesi
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <div className="flex items-center gap-2 pl-4 border-l ml-4 h-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintRecap(group.subjectId);
                      }}
                      title="Cetak Laporan"
                    >
                      <Printer className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteSubjectId(group.subjectId);
                      }}
                      title="Hapus Semua Sesi"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <AccordionContent className="pt-2 pb-6 px-1">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {group.sessions
                      .sort((a, b) => a.meetingNumber - b.meetingNumber)
                      .map((session) => (
                        <div
                          key={session.id}
                          className="flex flex-col border rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all bg-gray-50/30 duration-200"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <Badge
                              variant="secondary"
                              className="font-mono text-xs px-2"
                            >
                              P{session.meetingNumber}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <div
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  STATUS_COLORS[session.status]
                                }`}
                              >
                                {STATUS_LABELS[session.status]}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-gray-400 hover:text-blue-600"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openStatusDialog(session);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4 flex-1">
                            <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-blue-500" />
                              {dayjs(session.tanggal).format("DD MMM YYYY")}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              {dayjs(session.startTime).format("HH:mm")} -{" "}
                              {dayjs(session.endTime).format("HH:mm")}
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t border-gray-100">
                            <Link
                              href={`/homeroom/attendance/${session.id}`}
                              className="block w-full"
                            >
                              <Button
                                size="sm"
                                variant={
                                  session.status === "SELESAI"
                                    ? "outline"
                                    : "default"
                                }
                                className={`w-full h-9 text-xs font-semibold ${
                                  session.status === "DIMULAI"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : ""
                                }`}
                              >
                                {session.status === "SELESAI"
                                  ? "Lihat Rekap"
                                  : "Kelola Sesi"}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <ConfirmationDialog
            open={!!deleteSubjectId}
            onOpenChange={(open) => !open && setDeleteSubjectId(null)}
            title="Hapus Semua Sesi?"
            description="Apakah Anda yakin ingin menghapus SEMUA sesi presensi semester ini untuk mata pelajaran tersebut? Tindakan ini tidak dapat dibatalkan."
            onConfirm={handleDeleteSubjectSessions}
            isLoading={isDeleting}
          />

          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ubah Status Sesi</DialogTitle>
                <DialogDescription>
                  Ubah status sesi presensi secara manual.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TERJADWALKAN">Terjadwal</SelectItem>
                    <SelectItem value="DIMULAI">
                      Sedang Berlangsung (Dimulai)
                    </SelectItem>
                    <SelectItem value="SELESAI">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setStatusDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={!!updatingSessionId}
                >
                  {updatingSessionId ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
