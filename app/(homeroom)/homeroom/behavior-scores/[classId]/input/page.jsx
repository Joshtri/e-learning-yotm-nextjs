"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CalendarIcon } from "lucide-react";

export default function InputBehaviorScoresPage() {
  const { classId } = useParams();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scores, setScores] = useState({});
  const [academicYearInfo, setAcademicYearInfo] = useState(null);
  const [kehadiranInfo, setKehadiranInfo] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get(
        `/homeroom/behavior-scores/students?classId=${classId}`
      );
      const studentsData = res.data.data || [];
      const academicYear = res.data.academicYearInfo || null;
      const kehadiran = res.data.kehadiranInfo || null;

      setStudents(studentsData);
      setAcademicYearInfo(academicYear);
      setKehadiranInfo(kehadiran);

      const mapped = {};
      for (const s of studentsData) {
        mapped[s.id] = {
          spiritual: s.behaviorScore?.spiritual?.toString() || "",
          sosial: s.behaviorScore?.sosial?.toString() || "",
          kehadiran: s.autoCalculatedKehadiran?.toString() || "0", // Auto-calculated
          catatan: s.behaviorScore?.catatan || "",
        };
      }

      setScores(mapped);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data siswa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (studentId, field, value) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSetDefault = () => {
    const updatedScores = {};
    students.forEach((student) => {
      updatedScores[student.id] = {
        ...scores[student.id],
        spiritual: "70",
        sosial: "70",
      };
    });
    setScores(updatedScores);
    toast.success("Nilai default (70) berhasil diterapkan untuk semua siswa");
  };

  const handleSubmit = async () => {
    try {
      if (students.length === 0) {
        toast.error("Tidak ada data siswa");
        return;
      }
  
      const academicYearId = students[0]?.class?.academicYearId || students[0]?.academicYearId;
  
      if (!academicYearId) {
        toast.error("Tahun ajaran tidak ditemukan di data siswa");
        return;
      }
  
      const payload = Object.entries(scores).map(([studentId, data]) => ({
        studentId,
        spiritual: parseFloat(data.spiritual || 0),
        sosial: parseFloat(data.sosial || 0),
        kehadiran: parseFloat(data.kehadiran || 0),
        catatan: data.catatan || "",
      }));
  
      await api.post("/homeroom/behavior-scores/submit", {
        classId,
        academicYearId,
        scores: payload,
      });
  
      toast.success("Berhasil menyimpan nilai sikap!");
      router.push("/homeroom/behavior-scores");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan nilai sikap");
    }
  };
  

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Input Nilai Sikap & Kehadiran"
        description="Masukkan nilai sikap siswa untuk tahun ajaran aktif."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Nilai Sikap & Kehadiran", href: "/homeroom/behavior-scores" },
          { label: "Input Nilai Sikap & Kehadiran" },
        ]}
      />

      {/* Info Tahun Ajaran & Semester */}
      {academicYearInfo && (
        <Alert className="border-blue-200 bg-blue-50">
          <CalendarIcon className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">
            Tahun Ajaran {academicYearInfo.tahunAjaran} - {academicYearInfo.semester}
          </AlertTitle>
          <AlertDescription className="text-blue-700">
            {academicYearInfo.keterangan}
          </AlertDescription>
        </Alert>
      )}

      {/* Info Kehadiran Auto-Calculated */}
      {kehadiranInfo && (
        <Alert className="border-green-200 bg-green-50">
          <InfoIcon className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">
            Kehadiran Otomatis & Nilai Default
          </AlertTitle>
          <AlertDescription className="text-green-700 space-y-2">
            <div>
              <p className="font-semibold">📊 Kehadiran:</p>
              <p className="text-sm">{kehadiranInfo.keterangan}</p>
              <p className="text-sm mt-1 font-mono">{kehadiranInfo.rumus}</p>
            </div>
            <div className="pt-2 border-t border-green-200">
              <p className="font-semibold">⚡ Fitur Cepat:</p>
              <p className="text-sm">
                Gunakan tombol <strong>"Set Default 70"</strong> untuk mengisi
                nilai Spiritual dan Sosial dengan nilai 70 secara otomatis untuk
                semua siswa. Anda masih bisa mengubahnya sesuai kebutuhan.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Siswa</CardTitle>
          <Button
            variant="outline"
            onClick={handleSetDefault}
            disabled={students.length === 0}
            className="ml-auto"
          >
            <span className="mr-2">⚡</span>
            Set Default 70
          </Button>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>Spiritual</TableHead>
                  <TableHead>Sosial</TableHead>
                  <TableHead>Kehadiran</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Tidak ada siswa
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{student.namaLengkap}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={scores[student.id]?.spiritual || ""}
                          onChange={(e) =>
                            handleChange(
                              student.id,
                              "spiritual",
                              e.target.value
                            )
                          }
                          placeholder="0-100"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={scores[student.id]?.sosial || ""}
                          onChange={(e) =>
                            handleChange(student.id, "sosial", e.target.value)
                          }
                          placeholder="0-100"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={scores[student.id]?.kehadiran || ""}
                          disabled
                          className="bg-gray-100 cursor-not-allowed"
                          placeholder="Auto"
                          title="Nilai kehadiran dihitung otomatis dari data absensi"
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          rows={2}
                          value={scores[student.id]?.catatan || ""}
                          onChange={(e) =>
                            handleChange(student.id, "catatan", e.target.value)
                          }
                          placeholder="Catatan opsional"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSubmit}>Simpan Nilai Sikap</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
