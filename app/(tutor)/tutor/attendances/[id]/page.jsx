"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const ATTENDANCE_OPTIONS = [
  { value: "PRESENT", label: "Hadir" },
  { value: "SICK", label: "Sakit" },
  { value: "EXCUSED", label: "Izin" },
  { value: "ABSENT", label: "Alpha" },
];

export default function AttendanceDetailPage() {
  const { id } = useParams(); // id dari attendanceSession
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/tutor/attendances/${id}`);
      const siswa = res.data.data.daftarHadir || [];

      setStudents(siswa);

      const initialStatus = {};
      siswa.forEach((student) => {
        initialStatus[student.studentId] = student.status; // 🔥 pakai status dari API
      });
      setAttendanceStatus(initialStatus);
    } catch (err) {
      console.error("Gagal memuat data siswa:", err);
      toast.error("Gagal memuat data siswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStudents();
    }
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post(`/tutor/attendances/${id}/save`, {
        attendances: Object.entries(attendanceStatus).map(
          ([studentId, status]) => ({
            studentId,
            status,
          })
        ),
      });

      toast.success("Presensi berhasil disimpan!");
      router.push("/tutor/attendances");
    } catch (err) {
      console.error("Gagal menyimpan presensi:", err);
      toast.error("Gagal menyimpan presensi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Input Kehadiran"
          description="Memuat data siswa..."
          breadcrumbs={[
            { label: "Dashboard", href: "/tutor/dashboard" },
            { label: "Presensi", href: "/tutor/attendances" },
            { label: "Input Kehadiran" },
          ]}
        />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Input Kehadiran"
        description="Tentukan status kehadiran siswa pada sesi ini."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Presensi", href: "/tutor/attendances" },
          { label: "Input Kehadiran" },
        ]}
      />

      <div className="space-y-4">
        {students.map((student) => (
          <div
            key={student.studentId}
            className="flex items-center justify-between border p-4 rounded-lg"
          >
            <div>
              <p className="font-semibold">{student.namaLengkap}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>

            <Select
              value={attendanceStatus[student.studentId] ?? ""}
              onValueChange={(value) =>
                setAttendanceStatus((prev) => ({
                  ...prev,
                  [student.studentId]: value,
                }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue
                  placeholder="Belum diisi"
                  defaultValue=""
                  // kalau ada value tampilkan labelnya, kalau tidak "Belum diisi"
                  children={
                    attendanceStatus[student.studentId]
                      ? ATTENDANCE_OPTIONS.find(
                          (opt) =>
                            opt.value === attendanceStatus[student.studentId]
                        )?.label
                      : "Belum diisi"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Presensi"}
        </Button>
      </div>
    </div>
  );
}
