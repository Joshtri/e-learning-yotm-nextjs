"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, CheckCircle } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

dayjs.locale("id");

const STATUS_OPTIONS = [
  {
    value: "PRESENT",
    label: "Hadir",
    color: "text-green-600 bg-green-50 border-green-200",
  },
  {
    value: "SICK",
    label: "Sakit",
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    value: "EXCUSED",
    label: "Izin",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    value: "ABSENT",
    label: "Alpha",
    color: "text-red-600 bg-red-50 border-red-200",
  },
];

export default function AttendanceInputPage({ params }) {
  // Unwrap params using React.use()
  const { sessionId } = use(params);

  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState({}); // { studentId: { status, note, attendanceId } }
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Custom Confirmation Dialog States
  const [isConfirmingBulkPresent, setIsConfirmingBulkPresent] = useState(false);
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);

  useEffect(() => {
    if (sessionId) fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/homeroom/attendance/${sessionId}`);
      if (res.data.success) {
        const data = res.data.data;
        setSession(data);

        // Transform attendances into keyed object for easier editing
        const attMap = {};
        const studentList = [];

        // Data structure from API: session.attendances = [ { student: {...}, status: ... } ]
        if (data.attendances) {
          data.attendances.forEach((att) => {
            studentList.push(att.student);
            attMap[att.student.id] = {
              attendanceId: att.id,
              studentId: att.studentId || att.student.id,
              sessionId: att.sessionId || sessionId,
              status: att.status,
              note: att.note || "",
              attachment: att.attachment, // ✅
            };
          });
        }
        setStudents(studentList);
        setAttendances(attMap);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat detail sesi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleNoteChange = (studentId, note) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], note },
    }));
  };

  const handleBulkMarkPresent = () => {
    const newAttendances = { ...attendances };
    students.forEach((s) => {
      if (newAttendances[s.id]) {
        newAttendances[s.id].status = "PRESENT";
      }
    });
    setAttendances(newAttendances);
    setIsConfirmingBulkPresent(false);
    toast.success("Semua siswa ditandai hadir");
  };

  const handleSave = async (silent = false) => {
    try {
      setIsSaving(true);
      const updates = Object.values(attendances).map((att) => ({
        attendanceId: att.attendanceId,
        studentId: att.studentId,
        sessionId: att.sessionId,
        status: att.status,
        note: att.note,
      }));

      await api.patch("/homeroom/attendance/update-bulk", {
        attendances: updates,
        academicYearId: session.academicYearId,
      });

      if (!silent) toast.success("Data presensi berhasil disimpan");
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan data");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinishSessionTrigger = () => {
    setIsConfirmingFinish(true);
  };

  const executeFinishSession = async () => {
    const saved = await handleSave(true); // Save first
    if (!saved) {
      setIsConfirmingFinish(false);
      return;
    }

    try {
      setIsFinishing(true);
      await api.patch(`/homeroom/attendance/${sessionId}`, {
        status: "SELESAI",
      });
      toast.success("Sesi berhasil diselesaikan");
      fetchSessionDetails(); // Refresh to update UI
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyelesaikan sesi");
    } finally {
      setIsFinishing(false);
      setIsConfirmingFinish(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session) return <div className="p-6">Sesi tidak ditemukan</div>;

  const isReadOnly = session.status === "SELESAI";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/homeroom/attendance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {session.subject?.namaMapel} - Pertemuan {session.meetingNumber}
          </h1>
          <p className="text-muted-foreground">
            {session.tutor?.namaLengkap} •{" "}
            {dayjs(session.tanggal).format("dddd, DD MMMM YYYY")} •{" "}
            {dayjs(session.startTime).format("HH:mm")} -{" "}
            {dayjs(session.endTime).format("HH:mm")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold 
                ${
                  session.status === "DIMULAI"
                    ? "bg-green-100 text-green-700"
                    : session.status === "SELESAI"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-blue-100 text-blue-700"
                }`}
          >
            {session.status}
          </span>
        </div>
      </div>

      <div className="rounded-md border p-4 bg-white shadow-sm">
        {!isReadOnly && (
          <div className="flex justify-end gap-2 mb-4">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Draft
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsConfirmingBulkPresent(true)}
              disabled={isReadOnly || isSaving}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Hadir Semua
            </Button>
            <Button
              onClick={handleFinishSessionTrigger}
              disabled={isFinishing || isSaving}
            >
              {isFinishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Selesai & Tutup Sesi
            </Button>
          </div>
        )}

        <ConfirmationDialog
          open={isConfirmingBulkPresent}
          onOpenChange={setIsConfirmingBulkPresent}
          title="Konfirmasi Hadir Semua"
          description="Apakah Anda yakin ingin mengubah status semua siswa menjadi HADIR?"
          onConfirm={handleBulkMarkPresent}
          confirmText="Ya, Ubah Semua"
          cancelText="Batal"
        />

        <ConfirmationDialog
          open={isConfirmingFinish}
          onOpenChange={setIsConfirmingFinish}
          title="Selesaikan Sesi"
          description="Apakah Anda yakin ingin menyelesaikan sesi ini? Status akan berubah menjadi SELESAI dan draft akan disimpan otomatis."
          onConfirm={executeFinishSession}
          confirmText="Ya, Selesaikan"
          cancelText="Batal"
          isLoading={isFinishing}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">No</TableHead>
              <TableHead className="w-[200px]">Nama Siswa</TableHead>
              <TableHead>Status Kehadiran</TableHead>
              <TableHead className="w-[200px]">Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student, index) => {
              const att = attendances[student.id] || {};
              return (
                <TableRow key={student.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    <div>{student.namaLengkap}</div>
                    <div className="text-xs text-muted-foreground">
                      {student.nisn}
                    </div>
                  </TableCell>
                  <TableCell>
                    <RadioGroup
                      value={att.status}
                      onValueChange={(val) =>
                        handleStatusChange(student.id, val)
                      }
                      className="flex gap-2"
                      disabled={isReadOnly}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <div
                          key={opt.value}
                          className={`flex items-center space-x-2 border rounded-md px-3 py-2 cursor-pointer ${
                            att.status === opt.value
                              ? opt.color
                              : "border-transparent hover:bg-gray-50"
                          }`}
                        >
                          <RadioGroupItem
                            value={opt.value}
                            id={`${student.id}-${opt.value}`}
                          />
                          <Label
                            htmlFor={`${student.id}-${opt.value}`}
                            className="cursor-pointer"
                          >
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Catatan..."
                        value={att.note || ""}
                        onChange={(e) =>
                          handleNoteChange(student.id, e.target.value)
                        }
                        className="min-h-[60px]"
                        disabled={isReadOnly}
                      />
                      {att.attachment && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-blue-600"
                          onClick={() => {
                            const win = window.open();
                            if (win) {
                              win.document.write(
                                '<iframe src="' +
                                  att.attachment +
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
