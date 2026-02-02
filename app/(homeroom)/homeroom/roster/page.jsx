"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, User, Plus, Trash2, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

export default function HomeroomRosterPage() {
  const [classInfo, setClassInfo] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    classSubjectTutorId: "",
    dayOfWeek: "1",
    startTime: "08:00",
    endTime: "09:00",
  });

  useEffect(() => {
    fetchHomeroomInfo();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (classInfo?.id) {
      fetchSchedules(classInfo.id);
    }
  }, [classInfo]);

  const fetchHomeroomInfo = async () => {
    try {
      const res = await api.get("/homeroom/dashboard");
      if (res.data.success && res.data.data.classInfo) {
        setClassInfo(res.data.data.classInfo);
      } else {
        setError("Data kelas tidak ditemukan.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memuat informasi kelas.");
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/homeroom/subjects");
      if (res.data.success) {
        setSubjects(res.data.data);
      }
    } catch (err) {
      console.error("Gagal memuat mapel:", err);
    }
  };

  const fetchSchedules = async (classId) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/classes/${classId}/schedules`);
      if (res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memuat jadwal roster.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!formData.classSubjectTutorId)
      return toast.error("Pilih Mata Pelajaran");
    if (!classInfo?.id) return;

    try {
      setIsSaving(true);
      await api.post(`/classes/${classInfo.id}/schedules`, formData);
      toast.success("Jadwal berhasil ditambahkan");
      setIsAddOpen(false);
      fetchSchedules(classInfo.id);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Gagal menambah jadwal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      await api.delete(`/schedules/${scheduleId}`);
      toast.success("Jadwal dihapus");
      if (classInfo?.id) fetchSchedules(classInfo.id);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus jadwal");
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
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );
  });

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Jadwal Roster - ${classInfo?.namaKelas || "Loading..."}`}
        description="Jadwal mata pelajaran mingguan untuk kelas Anda."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Roster Kelas" },
        ]}
      />

      {/* Add Schedule Button */}
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tambah Jadwal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Jadwal Pelajaran</DialogTitle>
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
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.subjectName} - {sub.tutorName}
                      </SelectItem>
                    ))}
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
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jam Selesai</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddSchedule} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && !classInfo ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {DAYS.map((day) => {
            if (day.value > 6) return null; // Keep logic consistent

            const daySchedules = scheduleByDay[day.value] || [];
            return (
              <div
                key={day.value}
                className="bg-slate-50 border rounded-xl overflow-hidden shadow-sm flex flex-col"
              >
                <div className="bg-white border-b px-4 py-3 text-center">
                  <span className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                    {day.label}
                  </span>
                </div>

                <div className="p-3 space-y-3 flex-1">
                  {daySchedules.length > 0 ? (
                    daySchedules.map((s) => (
                      <div
                        key={s.id}
                        className="bg-white border p-3 rounded-lg shadow-sm text-sm hover:border-blue-400 transition-colors relative group"
                      >
                        <div className="font-semibold text-blue-900 line-clamp-2 mb-1">
                          {s.subjectName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                          <User className="h-3.5 w-3.5" />
                          <span className="truncate">{s.tutorName}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {dayjs(s.startTime).format("HH:mm")} -{" "}
                          {dayjs(s.endTime).format("HH:mm")}
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8 space-y-2 opacity-50">
                      <Calendar className="h-8 w-8" />
                      <span className="text-xs italic">Tidak ada jadwal</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
