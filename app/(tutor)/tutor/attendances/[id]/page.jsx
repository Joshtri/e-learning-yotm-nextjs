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
import { Input } from "@/components/ui/input"; // Import Input
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const ATTENDANCE_OPTIONS = [
  { value: "PRESENT", label: "Hadir" },
  { value: "SICK", label: "Sakit" },
  { value: "EXCUSED", label: "Izin" },
  { value: "ABSENT", label: "Alpha" },
];

const STATUS_BADGE_STYLES = {
  PRESENT: "bg-green-100 text-green-700 hover:bg-green-100",
  SICK: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  EXCUSED: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  ABSENT: "bg-red-100 text-red-700 hover:bg-red-100",
};

const STATUS_LABELS = {
  PRESENT: "Hadir",
  SICK: "Sakit",
  EXCUSED: "Izin",
  ABSENT: "Alpha",
};

export default function AttendanceDetailPage() {
  const { id } = useParams(); // id dari attendanceSession
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [attendanceNotes, setAttendanceNotes] = useState({}); // ✅ State for notes
  const [attendanceAttachments, setAttendanceAttachments] = useState({}); // ✅ State for attachments
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null); // ✅ Info session (subject, etc)

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/tutor/attendances/${id}`);
      const data = res.data.data;
      const siswa = data.daftarHadir || [];

      setStudents(siswa);
      setSessionInfo(data); // ✅ Save session info (subject, kelas, etc)

      const initialStatus = {};
      const initialNotes = {}; // ✅ Initial notes
      const initialAttachments = {}; // ✅
      siswa.forEach((student) => {
        initialStatus[student.studentId] = student.status;
        initialNotes[student.studentId] = student.note || ""; // Load existing note
        initialAttachments[student.studentId] = student.attachment; // Load attachment
      });
      setAttendanceStatus(initialStatus);
      setAttendanceNotes(initialNotes);
      setAttendanceAttachments(initialAttachments);
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
  const handleMarkAllPresent = () => {
    const allPresent = {};
    students.forEach((student) => {
      allPresent[student.studentId] = "PRESENT";
    });
    setAttendanceStatus(allPresent);
    toast.success("Semua siswa ditandai hadir!");
  };

  // Hitung statistik presensi
  const stats = {
    PRESENT: 0,
    SICK: 0,
    EXCUSED: 0,
    ABSENT: 0,
    UNFILLED: 0,
  };

  students.forEach((student) => {
    const status = attendanceStatus[student.studentId];
    if (status) {
      stats[status] = (stats[status] || 0) + 1;
    } else {
      stats.UNFILLED++;
    }
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post(`/tutor/attendances/${id}/save`, {
        attendances: Object.entries(attendanceStatus).map(
          ([studentId, status]) => ({
            studentId,
            status,
            note: attendanceNotes[studentId] || "", // ✅ Include note in save
          })
        ),
      });

      toast.success("Presensi berhasil disimpan!");

      if (sessionInfo?.kelas?.id) {
        router.push(`/tutor/attendances/class/${sessionInfo.kelas.id}`);
      } else {
        router.push("/tutor/attendances");
      }
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
        title={`Input Kehadiran${
          sessionInfo?.subject ? ` - ${sessionInfo.subject.namaMapel}` : ""
        }`}
        description={
          sessionInfo
            ? `${sessionInfo.kelas.namaKelas} - ${sessionInfo.kelas.program}${
                sessionInfo.subject
                  ? ` | Mata Pelajaran: ${sessionInfo.subject.namaMapel}`
                  : ""
              }`
            : "Tentukan status kehadiran siswa pada sesi ini."
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Presensi", href: "/tutor/attendances" },
          sessionInfo?.kelas
            ? {
                label: sessionInfo.kelas.namaKelas,
                href: `/tutor/attendances/class/${sessionInfo.kelas.id}`,
              }
            : null,
          { label: "Input Kehadiran", active: true },
        ].filter(Boolean)}
      />

      <div className="flex justify-end">
        <Button
          onClick={handleMarkAllPresent}
          variant="outline"
          disabled={students.length === 0}
        >
          ✓ Hadir Semua
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex flex-col items-center">
          <span className="text-2xl font-bold text-green-700">
            {stats.PRESENT}
          </span>
          <span className="text-sm text-green-600 font-medium">Hadir</span>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex flex-col items-center">
          <span className="text-2xl font-bold text-yellow-700">
            {stats.SICK}
          </span>
          <span className="text-sm text-yellow-600 font-medium">Sakit</span>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700">
            {stats.EXCUSED}
          </span>
          <span className="text-sm text-blue-600 font-medium">Izin</span>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex flex-col items-center">
          <span className="text-2xl font-bold text-red-700">
            {stats.ABSENT}
          </span>
          <span className="text-sm text-red-600 font-medium">Alpha</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex flex-col items-center">
          <span className="text-2xl font-bold text-gray-700">
            {stats.UNFILLED}
          </span>
          <span className="text-sm text-gray-600 font-medium">
            Belum Mengisi
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {students.map((student) => (
          <div
            key={student.studentId}
            className="flex items-center justify-between border p-4 rounded-lg"
          >
            <div className="flex-1">
              <p className="font-semibold">{student.namaLengkap}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>

              {/* Attendance History */}
              {student.attendanceHistory &&
                student.attendanceHistory.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">
                      Hari ini:
                    </span>
                    {student.attendanceHistory.map((history, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={`text-xs ${
                          STATUS_BADGE_STYLES[history.status]
                        }`}
                        title={`${history.subjectName} - ${history.tutorName}`}
                      >
                        {history.subjectName}: {STATUS_LABELS[history.status]}
                      </Badge>
                    ))}
                  </div>
                )}
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
                <SelectValue placeholder="Belum diisi" defaultValue="">
                  {attendanceStatus[student.studentId]
                    ? ATTENDANCE_OPTIONS.find(
                        (opt) =>
                          opt.value === attendanceStatus[student.studentId]
                      )?.label
                    : "Belum diisi"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Note Input for non-PRESENT status */}
            {(attendanceStatus[student.studentId] === "SICK" ||
              attendanceStatus[student.studentId] === "EXCUSED" ||
              attendanceStatus[student.studentId] === "ABSENT") && (
              <div className="ml-4 w-1/3 space-y-2">
                <Input
                  placeholder="Alasan (opsional)"
                  value={attendanceNotes[student.studentId] || ""}
                  onChange={(e) =>
                    setAttendanceNotes((prev) => ({
                      ...prev,
                      [student.studentId]: e.target.value,
                    }))
                  }
                  className="text-sm"
                />
                {attendanceAttachments[student.studentId] && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-blue-600"
                    onClick={() => {
                      const win = window.open();
                      if (win) {
                        win.document.write(
                          '<iframe src="' +
                            attendanceAttachments[student.studentId] +
                            '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>'
                        );
                      } else {
                        toast.error("Popup blocked");
                      }
                    }}
                  >
                    Lihat Surat
                  </Button>
                )}
              </div>
            )}
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
