"use client";

import { useEffect, useState, use, useCallback } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Clock, User, Pencil } from "lucide-react";
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
  // { value: 7, label: "Minggu" },
];

// Generate Hours 07-22
const HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 7;
  return h < 10 ? `0${h}` : `${h}`;
});

// Generate Minutes 00-55 (step 5)
const MINUTES = Array.from({ length: 12 }, (_, i) => {
  const m = i * 5;
  return m < 10 ? `0${m}` : `${m}`;
});

// Helper component for Time Picker
const TimeSelect = ({ value, onChange }) => {
  const [h, m] = value ? value.split(":") : ["07", "00"];

  const handleHourChange = (newH) => onChange(`${newH}:${m}`);
  const handleMinuteChange = (newM) => onChange(`${h}:${newM}`);

  return (
    <div className="flex gap-2 items-center">
      <Select value={h} onValueChange={handleHourChange}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Jam" />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((hour) => (
            <SelectItem key={hour} value={hour}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span>:</span>
      <Select value={m} onValueChange={handleMinuteChange}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Mnt" />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((minute) => (
            <SelectItem key={minute} value={minute}>
              {minute}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default function ClassSchedulePage({ params }) {
  // ... (existing code top part setup)
  const { classId: id } = use(params); // Map classId to id
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [subjects, setSubjects] = useState([]);

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    classSubjectTutorId: "",
    dayOfWeek: "1",
    startTime: "07:00",
    endTime: "08:00",
  });

  // ... (existing helper functions)

  // Skip to render part of Modal Content
  /* ... */

  // Replacement for the time inputs in render
  /* 
     Target lines around 306-327 (the grid for time input)
  */

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit State
  const [editId, setEditId] = useState(null);

  // ... (fetchClassData, fetchSubjects, fetchSchedules remain same - skipping for brevity in replacement if possible, but I need to be contiguous)
  // Actually, I can't skip lines in replace_file_content.
  // I'll just insert the State first.

  // Wait, I will target the existing Delete State block.

  /* ... inside ClassSchedulePage component ... */
  // Use useCallback to stabilize function references
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api.get(`/class-subject-tutors?classId=${id}`);
      if (res.data.success) {
        setSubjects(res.data.data);
      }
    } catch (err) {
      // Ignore
    }
  }, [id]);

  const fetchClassData = useCallback(async () => {
    try {
      const res = await api.get(`/classes/${id}`);
      if (res.data.success) {
        setClassData(res.data.data);
        // fetchSubjects is stable now, safe to call here?
        // Better to separate concerns or rely on effect deps
        fetchSubjects();
      }
    } catch (err) {
      console.error(err);
    }
  }, [id, fetchSubjects]);

  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/classes/${id}/schedules`);
      if (res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat jadwal");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchClassData();
      fetchSchedules();
    }
  }, [id, fetchClassData, fetchSchedules]);

  const handleSave = async () => {
    if (!formData.classSubjectTutorId)
      return toast.error("Pilih Mata Pelajaran");

    try {
      setIsSaving(true);

      // Convert Local HH:mm to ISO String (UTC)
      // Normalize to 1970-01-01 to match backend expectation
      // We set the date to Jan 1 1970 using Local Time
      const baseDate = dayjs().year(1970).month(0).date(1);

      const [startH, startM] = formData.startTime.split(":");
      const [endH, endM] = formData.endTime.split(":");

      // Validasi jam operasional (07:00 - 22:00)
      const startHour = parseInt(startH);
      const endHour = parseInt(endH);

      if (
        startHour < 7 ||
        startHour > 22 ||
        (startHour === 22 && parseInt(startM) > 0)
      ) {
        return toast.error("Jam mulai harus antara 07:00 - 22:00");
      }
      if (
        endHour < 7 ||
        endHour > 22 ||
        (endHour === 22 && parseInt(endM) > 0)
      ) {
        return toast.error("Jam selesai harus antara 07:00 - 22:00");
      }

      const startIso = baseDate
        .hour(startHour)
        .minute(parseInt(startM))
        .second(0)
        .millisecond(0)
        .toISOString();

      const endIso = baseDate
        .hour(endHour)
        .minute(parseInt(endM))
        .second(0)
        .millisecond(0)
        .toISOString();

      const payload = {
        ...formData,
        startTime: startIso,
        endTime: endIso,
      };

      if (editId) {
        await api.patch(`/schedules/${editId}`, payload);
        toast.success("Jadwal berhasil diperbarui");
      } else {
        await api.post(`/classes/${id}/schedules`, payload);
        toast.success("Jadwal berhasil ditambahkan");
      }
      setIsAddOpen(false);
      fetchSchedules();
      setEditId(null);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Gagal menyimpan jadwal";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = (dayVal = "1") => {
    setEditId(null);
    setFormData({
      classSubjectTutorId: "",
      dayOfWeek: String(dayVal),
      startTime: "08:00",
      endTime: "09:00",
    });
    setIsAddOpen(true);
  };

  const openEditModal = (schedule) => {
    setEditId(schedule.id);
    setFormData({
      classSubjectTutorId: schedule.classSubjectTutorId,
      dayOfWeek: String(schedule.dayOfWeek), // db stores int
      startTime: dayjs(schedule.startTime).format("HH:mm"),
      endTime: dayjs(schedule.endTime).format("HH:mm"),
    });
    setIsAddOpen(true);
  };

  const handleDelete = (scheduleId) => {
    setDeleteId(scheduleId);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/schedules/${deleteId}`);
      toast.success("Jadwal dihapus");
      fetchSchedules();
      setDeleteId(null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus jadwal");
    } finally {
      setIsDeleting(false);
    }
  };

  // Group schedules by Day
  const scheduleByDay = {};
  DAYS.forEach((d) => (scheduleByDay[d.value] = []));

  schedules.forEach((s) => {
    if (scheduleByDay[s.dayOfWeek]) {
      scheduleByDay[s.dayOfWeek].push(s);
    }
  });

  // Sort by time
  Object.keys(scheduleByDay).forEach((key) => {
    scheduleByDay[key].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime),
    );
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Atur Jadwal / Roster - ${classData?.namaKelas || "Loading..."}`}
        description="Kelola jadwal mingguan mata pelajaran"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Roster", href: "/admin/roster" },
          { label: classData?.namaKelas || "Detail Kelas" },
        ]}
      />

      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tambah Jadwal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editId ? "Ubah Jadwal" : "Tambah Jadwal Pelajaran"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Select
                  value={formData.classSubjectTutorId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, classSubjectTutorId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Mapel - Pengajar" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Tidak ada data mapel (Add CST first)
                      </SelectItem>
                    ) : (
                      subjects.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.subject?.namaMapel || sub.subjectName} -{" "}
                          {sub.tutor?.namaLengkap || sub.tutorName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hari</Label>
                <Select
                  value={String(formData.dayOfWeek)}
                  onValueChange={(val) =>
                    setFormData({ ...formData, dayOfWeek: val })
                  }
                >
                  <SelectTrigger>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jam Mulai</Label>
                  <TimeSelect
                    value={formData.startTime}
                    onChange={(val) =>
                      setFormData({ ...formData, startTime: val })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jam Selesai</Label>
                  <TimeSelect
                    value={formData.endTime}
                    onChange={(val) =>
                      setFormData({ ...formData, endTime: val })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {DAYS.map((day) => {
            if (day.value > 6) return null;

            const daySchedules = scheduleByDay[day.value] || [];
            return (
              <div
                key={day.value}
                className="bg-slate-50 border rounded-lg p-3 min-h-[300px] flex flex-col"
              >
                <div className="text-center mb-3 bg-white border px-3 py-1.5 rounded shadow-sm">
                  <span className="font-bold text-sm uppercase">
                    {day.label}
                  </span>
                </div>

                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex-1 space-y-3">
                    {daySchedules.map((s) => (
                      <div
                        key={s.id}
                        className="bg-white border p-3 pr-16 rounded shadow-sm text-sm relative group hover:border-blue-300"
                      >
                        <div className="font-semibold text-blue-800 line-clamp-2">
                          {s.subjectName}
                        </div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {s.tutorName}
                        </div>
                        <div className="text-xs bg-gray-100 inline-flex items-center px-1.5 py-0.5 rounded">
                          <Clock className="h-3 w-3 mr-1" />
                          {dayjs(s.startTime).format("HH:mm")} -{" "}
                          {dayjs(s.endTime).format("HH:mm")}
                        </div>

                        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {daySchedules.length === 0 && (
                      <div className="text-center text-xs text-muted-foreground py-4 italic">
                        Kosong
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full text-xs border border-dashed text-muted-foreground hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 mt-2"
                    size="sm"
                    onClick={() => openAddModal(day.value)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Tambah
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={executeDelete}
        title="Hapus Jadwal"
        description="Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
