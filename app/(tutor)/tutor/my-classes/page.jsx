"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataToolbar } from "@/components/ui/data-toolbar";
import {
  FileText,
  MessageSquare,
  Users,
  Calendar,
  ChevronRight,
  Clock,
  Trash2,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AcademicYearFilter } from "@/components/AcademicYearFilter";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSpinner } from "@/components/ui/loading/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

const DAYS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" },
];

export default function MyClassesPage() {
  const [data, setData] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years");
      const years = res.data.data.academicYears || [];

      setAcademicYears(years);

      // Pilih tahun ajaran yang aktif sebagai default
      const activeYear = years.find((year) => year.isActive);
      if (activeYear && !selectedAcademicYear) {
        setSelectedAcademicYear(activeYear.id);
      }
    } catch (error) {
      console.error("Gagal mengambil data tahun ajaran:", error);
      toast.error("Gagal memuat tahun ajaran");
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Add academicYearId to the request if selected
      const params = new URLSearchParams();
      if (selectedAcademicYear) {
        params.append("academicYearId", selectedAcademicYear);
      }

      const res = await api.get(`/tutor/my-classes?${params.toString()}`);
      setData(res.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data kelas tutor:", error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedAcademicYear]);

  // Filter data based on selected academic year and search query
  const filteredData = useMemo(() => {
    let filtered = data;

    // Filter by academic year
    if (selectedAcademicYear) {
      filtered = filtered.filter(
        (item) => item.class?.academicYear?.id === selectedAcademicYear,
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.class?.namaKelas
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.subject?.namaMapel
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.class?.program?.namaPaket
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  }, [data, selectedAcademicYear, searchQuery]);

  // Schedule Dialog Logic
  const [scheduleDialog, setScheduleDialog] = useState({
    open: false,
    cstId: null,
    classId: null,
    subjectName: "",
    className: "",
  });
  const [cstSchedules, setCstSchedules] = useState([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: "1",
    startTime: "08:00",
    endTime: "09:30",
  });

  const openScheduleDialog = (row) => {
    setScheduleDialog({
      open: true,
      cstId: row.id,
      classId: row.class?.id,
      subjectName: row.subject?.namaMapel,
      className: row.class?.namaKelas,
    });
    fetchCstSchedules(row.class?.id, row.id);
  };

  const fetchCstSchedules = async (classId, cstId) => {
    try {
      setIsScheduleLoading(true);
      const res = await api.get(`/classes/${classId}/schedules`);
      if (res.data.success) {
        // Filter only for this CST
        const filtered = res.data.data.filter(
          (s) => s.classSubjectTutorId === cstId,
        );
        setCstSchedules(filtered);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat jadwal");
    } finally {
      setIsScheduleLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!scheduleDialog.cstId || !scheduleDialog.classId) return;
    try {
      setIsScheduleSaving(true);
      await api.post(`/classes/${scheduleDialog.classId}/schedules`, {
        classSubjectTutorId: scheduleDialog.cstId,
        ...scheduleForm,
      });
      toast.success("Jadwal ditambahkan");
      fetchCstSchedules(scheduleDialog.classId, scheduleDialog.cstId);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Gagal menambah jadwal");
    } finally {
      setIsScheduleSaving(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      await api.delete(`/schedules/${scheduleId}`);
      toast.success("Jadwal dihapus");
      fetchCstSchedules(scheduleDialog.classId, scheduleDialog.cstId);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus jadwal");
    }
  };

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Kelas",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.class?.namaKelas || "-"}</div>
          <div className="text-sm text-muted-foreground">
            {row.subject?.namaMapel || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Program",
      cell: (row) => row.class?.program?.namaPaket || "-",
    },
    {
      header: "Wali Kelas", // ✅ tambahan baru
      cell: (row) => row.class?.homeroomTeacher?.namaLengkap || "-",
    },
    {
      header: "Tahun Akademik",
      cell: (row) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{`${row.class?.academicYear?.tahunMulai || "-"}/${
            row.class?.academicYear?.tahunSelesai || "-"
          } - ${row.class?.academicYear?.semester || ""}`}</span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => {
        const isActive = true; // Replace with actual logic
        return (
          <StatusBadge
            status={isActive ? "active" : "completed"}
            label={isActive ? "Aktif" : "Selesai"}
          />
        );
      },
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          {!row.isHomeroomOnly && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/tutor/my-classes/${row.id}/students`)
                }
              >
                <Users className="h-4 w-4 mr-1" />
                Siswa
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openScheduleDialog(row)}
              >
                <Clock className="h-4 w-4 mr-1" />
                Atur Jadwal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/tutor/my-classes/${row.id}/materials`)
                }
              >
                <FileText className="h-4 w-4 mr-1" />
                Materi
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  router.push(`/tutor/my-classes/${row.id}/discussions`)
                }
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Diskusi
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  router.push(`/tutor/my-classes/${row.id}/detail`)
                }
              >
                Detail
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}
          {row.isHomeroomOnly && (
            <Button
              variant="secondary"
              size="sm"
              disabled
              title="Fitur Wali Kelas belum tersedia di halaman ini"
            >
              Detail Wali Kelas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Kelas yang Saya Ajar"
        description="Daftar kelas dan mata pelajaran yang Anda ajar saat ini."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor" },
          { label: "Kelas" },
        ]}
      />

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* <TabsList>
            <TabsTrigger value="all">Semua Kelas</TabsTrigger>
            <TabsTrigger value="active">Aktif</TabsTrigger>
            <TabsTrigger value="completed">Selesai</TabsTrigger>
          </TabsList> */}

          <DataToolbar
            searchValue={searchQuery}
            onSearchChange={(value) => setSearchQuery(value)}
            searchPlaceholder="Cari kelas, mapel, program..."
            filterOptions={[
              {
                label: "Tahun Ajaran",
                content: (
                  <AcademicYearFilter
                    academicYears={academicYears}
                    selectedId={selectedAcademicYear}
                    onChange={(val) => setSelectedAcademicYear(val)}
                  />
                ),
              },
            ]}
          />
        </div>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredData.length > 0 ? (
            <DataTable
              data={filteredData}
              columns={columns}
              isLoading={isLoading}
              loadingMessage="Memuat data kelas..."
              emptyMessage="Tidak ada kelas ditemukan"
              keyExtractor={(item) => item.id}
            />
          ) : (
            <EmptyState
              title="Belum ada kelas"
              description="Anda belum memiliki kelas yang diajar pada tahun ajaran ini."
              icon={<Users className="h-6 w-6 text-muted-foreground" />}
            />
          )}
        </TabsContent>

        <TabsContent value="active">
          <EmptyState
            title="Belum ada kelas aktif"
            description="Anda belum memiliki kelas aktif pada tahun ajaran ini."
            icon={<Users className="h-6 w-6 text-muted-foreground" />}
          />
        </TabsContent>

        <TabsContent value="completed">
          <EmptyState
            title="Belum ada kelas selesai"
            description="Anda belum memiliki kelas yang telah selesai pada tahun ajaran ini."
            icon={<Users className="h-6 w-6 text-muted-foreground" />}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={scheduleDialog.open}
        onOpenChange={(v) =>
          setScheduleDialog((prev) => ({ ...prev, open: v }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atur Jadwal Mengajar</DialogTitle>
            <div className="text-sm text-muted-foreground">
              {scheduleDialog.className} - {scheduleDialog.subjectName}
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* List Existing Schedules */}
            <div className="space-y-2 border rounded-md p-3 bg-slate-50">
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">
                Jadwal Saat Ini
              </h4>
              {isScheduleLoading ? (
                <div className="flex justify-center py-2">
                  <LoadingSpinner size="sm" />
                </div>
              ) : cstSchedules.length > 0 ? (
                <div className="space-y-2">
                  {cstSchedules.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between bg-white p-2 rounded border text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                          {DAYS.find((d) => d.value === s.dayOfWeek)?.label},
                        </span>
                        <span>
                          {dayjs(s.startTime).format("HH:mm")} -{" "}
                          {dayjs(s.endTime).format("HH:mm")}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSchedule(s.id)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-xs text-muted-foreground py-2 italic">
                  Belum ada jadwal
                </div>
              )}
            </div>

            {/* Add New Form */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Tambah Jadwal Baru</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Hari</Label>
                  <Select
                    value={String(scheduleForm.dayOfWeek)}
                    onValueChange={(val) =>
                      setScheduleForm({ ...scheduleForm, dayOfWeek: val })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Pilih Hari" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Mulai</Label>
                  <Input
                    type="time"
                    className="h-8"
                    value={scheduleForm.startTime}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Selesai</Label>
                  <Input
                    type="time"
                    className="h-8"
                    value={scheduleForm.endTime}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={handleAddSchedule}
                disabled={isScheduleSaving}
              >
                {isScheduleSaving && (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                )}
                Simpan Jadwal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
