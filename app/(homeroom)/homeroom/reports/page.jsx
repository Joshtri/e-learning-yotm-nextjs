"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import api from "@/lib/axios";
import {
  FileText,
  Download,
  Users,
  User,
  ClipboardCheck,
  GraduationCap,
  Loader2,
} from "lucide-react";

export default function HomeroomReportsPage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(false);
  const [myClass, setMyClass] = useState(null);

  // Fetch academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const res = await api.get("/academic-years");
        setAcademicYears(res.data.data.academicYears || []);

        // Set default to active year
        const activeYear = res.data.data.academicYears.find((y) => y.isActive);
        if (activeYear) {
          setSelectedAcademicYear(activeYear.id);
        }
      } catch {
        toast.error("Gagal memuat tahun ajaran");
      }
    };

    fetchAcademicYears();
  }, []);

  // Fetch my class info
  useEffect(() => {
    const fetchMyClass = async () => {
      try {
        const res = await api.get("/homeroom/about-class");
        if (res.data.success && res.data.data) {
          setMyClass(res.data.data);
        }
      } catch {
        // Silent error for class info
      }
    };

    fetchMyClass();
  }, []);

  // Fetch students when academic year selected
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get("/homeroom/my-students", {
          params: { academicYearId: selectedAcademicYear },
        });
        setStudents(res.data.data || []);
      } catch {
        toast.error("Gagal memuat data siswa");
      }
    };

    if (selectedAcademicYear) {
      fetchStudents();
    }
  }, [selectedAcademicYear]);

  // Download handlers
  const downloadAttendanceReport = async (format) => {
    if (!selectedAcademicYear) {
      toast.error("Pilih tahun ajaran terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/homeroom/reports/attendance", {
        params: {
          academicYearId: selectedAcademicYear,
          format,
        },
        responseType: "blob",
      });

      const selectedYear = academicYears.find(
        (y) => y.id === selectedAcademicYear,
      );
      const filename = `laporan-presensi-${selectedYear?.tahunMulai}-${selectedYear?.semester}.${format}`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(
        `Laporan presensi berhasil diunduh (${format.toUpperCase()})`,
      );
    } catch {
      toast.error("Gagal mengunduh laporan presensi");
    } finally {
      setLoading(false);
    }
  };

  const downloadClassScoresReport = async (format) => {
    if (!selectedAcademicYear) {
      toast.error("Pilih tahun ajaran terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/homeroom/reports/class-scores", {
        params: {
          academicYearId: selectedAcademicYear,
          format,
        },
        responseType: "blob",
      });

      const selectedYear = academicYears.find(
        (y) => y.id === selectedAcademicYear,
      );
      const filename = `laporan-nilai-kelas-${selectedYear?.tahunMulai}-${selectedYear?.semester}.${format}`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(
        `Laporan nilai kelas berhasil diunduh (${format.toUpperCase()})`,
      );
    } catch {
      toast.error("Gagal mengunduh laporan nilai kelas");
    } finally {
      setLoading(false);
    }
  };

  const downloadStudentScoreReport = async (format) => {
    if (!selectedStudent) {
      toast.error("Pilih siswa terlebih dahulu");
      return;
    }

    if (!selectedAcademicYear) {
      toast.error("Pilih tahun ajaran terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/homeroom/reports/student-score", {
        params: {
          studentId: selectedStudent,
          academicYearId: selectedAcademicYear,
          format,
        },
        responseType: "blob",
      });

      const student = students.find((s) => s.id === selectedStudent);
      const selectedYear = academicYears.find(
        (y) => y.id === selectedAcademicYear,
      );
      const filename = `rapor-${student?.namaLengkap?.replace(/\s+/g, "-")}-${
        selectedYear?.tahunMulai
      }-${selectedYear?.semester}.${format}`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Rapor siswa berhasil diunduh (${format.toUpperCase()})`);
    } catch {
      toast.error("Gagal mengunduh rapor siswa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Laporan Wali Kelas"
        description="Cetak laporan presensi dan nilai siswa dalam format PDF atau Excel"
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Laporan" },
        ]}
      />

      {myClass && (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nama Kelas:</span>{" "}
                {myClass.namaKelas}
              </div>
              <div>
                <span className="font-medium">Program:</span>{" "}
                {myClass.program?.namaPaket}
              </div>
              <div>
                <span className="font-medium">Tahun Ajaran:</span>{" "}
                {myClass.academicYear?.tahunMulai}/
                {myClass.academicYear?.tahunSelesai}
              </div>
              <div>
                <span className="font-medium">Semester:</span>{" "}
                {myClass.academicYear?.semester}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Laporan Presensi
          </TabsTrigger>
          <TabsTrigger value="class-scores">
            <Users className="h-4 w-4 mr-2" />
            Nilai Kelas
          </TabsTrigger>
          <TabsTrigger value="student-score">
            <User className="h-4 w-4 mr-2" />
            Rapor Individual
          </TabsTrigger>
        </TabsList>

        {/* Laporan Presensi */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Presensi Kelas</CardTitle>
              <CardDescription>
                Unduh rekap presensi siswa yang dipisahkan per Mata Pelajaran
                dalam satu file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tahun Ajaran
                </label>
                <Select
                  value={selectedAcademicYear}
                  onValueChange={setSelectedAcademicYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun ajaran" />
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.tahunMulai}/{y.tahunSelesai} - {y.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => downloadAttendanceReport("pdf")}
                  disabled={loading || !selectedAcademicYear}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Download PDF
                </Button>
                <Button
                  onClick={() => downloadAttendanceReport("xlsx")}
                  disabled={loading || !selectedAcademicYear}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Nilai Kelas */}
        <TabsContent value="class-scores">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Nilai Kelas</CardTitle>
              <CardDescription>
                Unduh rekap nilai seluruh siswa dalam satu kelas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tahun Ajaran
                </label>
                <Select
                  value={selectedAcademicYear}
                  onValueChange={setSelectedAcademicYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun ajaran" />
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.tahunMulai}/{y.tahunSelesai} - {y.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => downloadClassScoresReport("pdf")}
                  disabled={loading || !selectedAcademicYear}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Download PDF
                </Button>
                <Button
                  onClick={() => downloadClassScoresReport("xlsx")}
                  disabled={loading || !selectedAcademicYear}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rapor Individual */}
        <TabsContent value="student-score">
          <Card>
            <CardHeader>
              <CardTitle>Rapor Siswa Individual</CardTitle>
              <CardDescription>
                Unduh rapor nilai siswa secara individual per semester
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tahun Ajaran
                  </label>
                  <Select
                    value={selectedAcademicYear}
                    onValueChange={setSelectedAcademicYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {academicYears.map((y) => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.tahunMulai}/{y.tahunSelesai} - {y.semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Pilih Siswa
                  </label>
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih siswa" />
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.namaLengkap} - {s.nisn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => downloadStudentScoreReport("pdf")}
                  disabled={
                    loading || !selectedStudent || !selectedAcademicYear
                  }
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GraduationCap className="h-4 w-4 mr-2" />
                  )}
                  Download Rapor PDF
                </Button>
                <Button
                  onClick={() => downloadStudentScoreReport("xlsx")}
                  disabled={
                    loading || !selectedStudent || !selectedAcademicYear
                  }
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
