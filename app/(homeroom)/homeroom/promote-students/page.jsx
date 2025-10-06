"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, InfoIcon, CalendarCheck, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PromoteStudentsPage() {
  const [students, setStudents] = useState([]);
  const [academicYear, setAcademicYear] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [className, setClassName] = useState("");
  const [program, setProgram] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedInfo, setDeniedInfo] = useState(null);
  const [availableAcademicYears, setAvailableAcademicYears] = useState([]);
  const [targetAcademicYearId, setTargetAcademicYearId] = useState("");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [targetClassIdForPassed, setTargetClassIdForPassed] = useState("");
  const [targetClassIdForFailed, setTargetClassIdForFailed] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchAvailableAcademicYears();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setAccessDenied(false);
      const res = await api.get("/homeroom/my-students-for-promotion");
      const { students, academicYear, className, program } = res.data.data || {};
      setStudents(students || []);
      setAcademicYear(academicYear || null);
      setClassName(className || "");
      setProgram(program || "");
    } catch (error) {
      console.error(error);

      // Handle 403 - Semester validation error
      if (error.response?.status === 403) {
        setAccessDenied(true);
        setDeniedInfo(error.response?.data);
        toast.error(error.response?.data?.message || "Akses ditolak");
      } else {
        toast.error("Gagal memuat data siswa");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableAcademicYears = async () => {
    try {
      const res = await api.get("/homeroom/available-academic-years-for-promotion");
      setAvailableAcademicYears(res.data.data || []);

      // Log info tahun ajaran saat ini
      if (res.data.currentAcademicYear) {
        console.log("Tahun Ajaran Saat Ini:", res.data.currentAcademicYear);
      }
    } catch (error) {
      console.error(error);

      // Handle 403 - Semester validation error
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || "Akses ditolak");
      } else {
        toast.error("Gagal memuat tahun ajaran tersedia");
      }
    }
  };

  const fetchAvailableClasses = async (academicYearId) => {
    if (!academicYearId) {
      setAvailableClasses([]);
      return;
    }

    try {
      setIsLoadingClasses(true);
      const res = await api.get(`/homeroom/available-classes?academicYearId=${academicYearId}`);
      setAvailableClasses(res.data.data || []);

      // Log info kelas saat ini
      if (res.data.currentClass) {
        console.log("Kelas Saat Ini:", res.data.currentClass);
        console.log("Kelas Tersedia untuk Tahun Ajaran Baru:", res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat kelas tersedia");
      setAvailableClasses([]);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Fetch kelas saat tahun ajaran dipilih
  const handleAcademicYearChange = (yearId) => {
    setTargetAcademicYearId(yearId);
    setTargetClassIdForPassed("");
    setTargetClassIdForFailed("");
    fetchAvailableClasses(yearId);
  };

  const handleSwitchChange = (studentId, checked) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, naikKelas: checked } : s))
    );
  };

  // Toggle semua siswa naik kelas
  const handleToggleAll = (status) => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, naikKelas: status }))
    );
    toast.success(
      status
        ? `✅ Semua ${students.length} siswa ditandai NAIK KELAS`
        : `❌ Semua ${students.length} siswa ditandai TIDAK NAIK`
    );
  };

  // Toggle berdasarkan nilai (smart)
  const handleSmartToggle = () => {
    const PASSING_GRADE = 65; // KKM
    const MIN_ATTENDANCE = 75; // Minimal kehadiran 75%

    let passedCount = 0;
    let failedCount = 0;

    setStudents((prev) =>
      prev.map((s) => {
        const nilai = s.nilaiTotal || 0;
        const kehadiran = s.attendanceSummary?.persen || 0;

        // Auto naik jika nilai >= 65 DAN kehadiran >= 75%
        const shouldPass = nilai >= PASSING_GRADE && kehadiran >= MIN_ATTENDANCE;

        if (shouldPass) {
          passedCount++;
        } else {
          failedCount++;
        }

        return { ...s, naikKelas: shouldPass };
      })
    );

    toast.success(
      `🤖 Smart Toggle: ${passedCount} siswa naik (nilai ≥${PASSING_GRADE} & kehadiran ≥${MIN_ATTENDANCE}%), ${failedCount} siswa tidak naik`,
      { duration: 5000 }
    );
  };

  const handlePromote = async () => {
    if (!targetAcademicYearId || !targetClassIdForPassed) {
      toast.error("Mohon pilih tahun ajaran dan kelas tujuan untuk siswa yang naik");
      return;
    }

    // Validasi: jika ada siswa yang tidak naik, harus pilih kelas mengulang
    const hasFailedStudents = students.some((s) => !s.naikKelas);
    if (hasFailedStudents && !targetClassIdForFailed) {
      const confirm = window.confirm(
        "Ada siswa yang tidak naik kelas tetapi Anda belum memilih kelas mengulang. Siswa tersebut akan tetap di kelas lama. Lanjutkan?"
      );
      if (!confirm) return;
    }

    try {
      const res = await api.patch("/homeroom/promote-students", {
        promotions: students.map((s) => ({
          studentId: s.id,
          naikKelas: s.naikKelas || false,
        })),
        targetAcademicYearId,
        targetClassIdForPassed,
        targetClassIdForFailed: targetClassIdForFailed || null,
      });

      toast.success(res.data.message || "Berhasil memproses kenaikan kelas");

      // Reload data
      fetchStudents();
    } catch (error) {
      console.error(error);

      if (error.response?.data?.invalidStudents) {
        const invalidList = error.response.data.invalidStudents
          .map((s) => `${s.namaLengkap}: ${s.issues.join(", ")}`)
          .join("\n");
        toast.error(`Gagal: \n${invalidList}`);
      } else {
        toast.error(
          error.response?.data?.message || "Gagal memproses kenaikan kelas"
        );
      }
    }
  };

  const handleViewDetail = (student) => {
    setSelectedStudent(student);
    setShowDetailDialog(true);
  };

  const getTrendIcon = (ganjil, genap) => {
    if (!ganjil || !genap) return <Minus className="h-4 w-4 text-gray-400" />;
    if (genap > ganjil) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (genap < ganjil) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Manajemen Naik Kelas"
        description="Kelola kenaikan kelas siswa Anda (Hanya tersedia pada Semester GENAP)."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Manajemen Naik Kelas" },
        ]}
      />

      {/* Alert untuk Semester GANJIL */}
      {accessDenied && deniedInfo && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-900 font-semibold">
            Akses Ditolak - {deniedInfo.currentSemester}
          </AlertTitle>
          <AlertDescription className="text-red-700">
            <p className="mb-2">{deniedInfo.message}</p>
            {deniedInfo.academicYear && (
              <p className="text-sm">
                Tahun Ajaran Saat Ini: {deniedInfo.academicYear.tahunMulai}/
                {deniedInfo.academicYear.tahunSelesai} - Semester{" "}
                <span className="font-semibold">
                  {deniedInfo.academicYear.semester}
                </span>
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Info Kenaikan Kelas */}
      {!accessDenied && academicYear && (
        <Alert className="border-blue-200 bg-blue-50">
          <InfoIcon className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold">
            Informasi Kenaikan Kelas
          </AlertTitle>
          <AlertDescription className="text-blue-700 space-y-2">
            <p>
              <strong>Kelas:</strong> {className} ({program})
            </p>
            <p>
              <strong>Tahun Ajaran:</strong> {academicYear.tahunMulai}/
              {academicYear.tahunSelesai} - Semester{" "}
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md font-semibold">
                {academicYear.semester}
              </span>
            </p>
            <div className="pt-2 border-t border-blue-200 mt-2">
              <p className="font-semibold flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                Catatan Penting:
              </p>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                <li>
                  Kenaikan kelas menghitung <strong>total nilai</strong> dari Semester
                  GANJIL dan GENAP tahun ini ({academicYear.tahunMulai}/{academicYear.tahunSelesai})
                </li>
                <li>
                  Siswa akan naik ke <strong>Tahun Ajaran Baru</strong> dengan semester <strong>GANJIL</strong>
                </li>
                <li>
                  Pastikan admin sudah membuat kelas tujuan di tahun ajaran baru
                </li>
                <li>
                  Kehadiran yang ditampilkan adalah gabungan dari kedua semester
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!accessDenied && (
        <div className="space-y-6 mt-6">
          {/* Form Input Target */}
          <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
            <div className="space-y-2">
              <Label htmlFor="targetYear">
                1. Pilih Target Tahun Ajaran <span className="text-red-500">*</span>
              </Label>
              <select
                id="targetYear"
                value={targetAcademicYearId}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">-- Pilih Tahun Ajaran --</option>
                {availableAcademicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.tahunMulai}/{year.tahunSelesai} - Semester {year.semester}
                    {year.isActive && " (Aktif)"}
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200 mt-1">
                💡 <strong>Contoh:</strong> Kelas saat ini di tahun <strong>{academicYear?.tahunMulai}/{academicYear?.tahunSelesai} GENAP</strong>,
                maka pilih tahun ajaran <strong>{academicYear ? academicYear.tahunSelesai : "20XX"}/{academicYear ? academicYear.tahunSelesai + 1 : "20XX"} GANJIL</strong>
              </p>
            </div>

            {targetAcademicYearId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="targetClassPassed">
                    2. Kelas Tujuan untuk Siswa yang NAIK{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {isLoadingClasses ? (
                    <div className="text-sm text-gray-500">Memuat kelas...</div>
                  ) : availableClasses.length === 0 ? (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        Belum ada kelas yang dibuat admin untuk tahun ajaran ini.
                        Hubungi admin untuk membuat kelas terlebih dahulu.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <select
                        id="targetClassPassed"
                        value={targetClassIdForPassed}
                        onChange={(e) => setTargetClassIdForPassed(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">-- Pilih Kelas Tujuan --</option>
                        {availableClasses.map((kelas) => (
                          <option key={kelas.id} value={kelas.id}>
                            {kelas.namaKelas} - {kelas.program} ({kelas.studentCount}{" "}
                            siswa)
                            {kelas.homeroomTeacher &&
                              ` - Wali: ${kelas.homeroomTeacher.nama}`}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200 mt-1">
                        ✅ <strong>Contoh:</strong> Siswa dari kelas <strong>{className}</strong> ({program})
                        tahun {academicYear?.tahunMulai}/{academicYear?.tahunSelesai} akan naik ke kelas <strong>tingkat lebih tinggi</strong> di tahun ajaran baru
                      </p>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetClassFailed">
                    3. Kelas untuk Siswa yang TIDAK NAIK (Mengulang){" "}
                    <span className="text-gray-500">(Opsional)</span>
                  </Label>
                  {isLoadingClasses ? (
                    <div className="text-sm text-gray-500">Memuat kelas...</div>
                  ) : (
                    <>
                      <select
                        id="targetClassFailed"
                        value={targetClassIdForFailed}
                        onChange={(e) => setTargetClassIdForFailed(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">-- Pilih Kelas Mengulang (Opsional) --</option>
                        {availableClasses.map((kelas) => (
                          <option key={kelas.id} value={kelas.id}>
                            {kelas.namaKelas} - {kelas.program} ({kelas.studentCount}{" "}
                            siswa)
                            {kelas.homeroomTeacher &&
                              ` - Wali: ${kelas.homeroomTeacher.nama}`}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200 mt-1">
                        ⚠️ Siswa yang tidak naik akan <strong>mengulang di tingkat yang sama</strong> di tahun ajaran baru.
                        Jika tidak dipilih kelas mengulang, siswa akan tetap di kelas lama (tahun ajaran non-aktif).
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Tombol Toggle All */}
          {students.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    Aksi Cepat untuk Semua Siswa
                  </p>
                  <p className="text-xs text-slate-600">
                    Tandai status naik kelas untuk semua {students.length} siswa sekaligus
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAll(true)}
                    className="bg-green-50 border-green-300 hover:bg-green-100 text-green-700 font-semibold"
                  >
                    ✅ Semua Naik
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAll(false)}
                    className="bg-red-50 border-red-300 hover:bg-red-100 text-red-700 font-semibold"
                  >
                    ❌ Semua Tidak Naik
                  </Button>
                </div>
              </div>

              {/* Smart Toggle berdasarkan Nilai */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="text-lg">🤖</span>
                      Smart Toggle (Otomatis berdasarkan Nilai & Kehadiran)
                    </p>
                    <p className="text-xs text-slate-600">
                      Auto tandai naik jika: <strong>Nilai ≥ 65</strong> DAN <strong>Kehadiran ≥ 75%</strong>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSmartToggle}
                    className="bg-purple-50 border-purple-300 hover:bg-purple-100 text-purple-700 font-semibold"
                  >
                    🎯 Terapkan Smart Toggle
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DataTable
            data={students}
          columns={[
            {
              header: "No",
              cell: (_, i) => i + 1,
              className: "w-[50px]",
            },
            {
              header: "Nama Siswa",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.namaLengkap}</p>
                  <p className="text-xs text-muted-foreground">NISN: {row.nisn || "-"}</p>
                </div>
              ),
            },
            {
              header: "Nilai Sem. Ganjil",
              cell: (row) => {
                if (!row.nilaiSemesterGanjil) return <span className="text-red-500">-</span>;
                return (
                  <span className="font-semibold text-blue-700">
                    {row.nilaiSemesterGanjil.toFixed(2)}
                  </span>
                );
              },
            },
            {
              header: "Nilai Sem. Genap",
              cell: (row) => {
                if (!row.nilaiSemesterGenap) return <span className="text-red-500">-</span>;
                return (
                  <span className="font-semibold text-purple-700">
                    {row.nilaiSemesterGenap.toFixed(2)}
                  </span>
                );
              },
            },
            {
              header: "Trend",
              cell: (row) => (
                <div className="flex justify-center">
                  {getTrendIcon(row.nilaiSemesterGanjil, row.nilaiSemesterGenap)}
                </div>
              ),
              className: "w-[60px]",
            },
            {
              header: "Nilai Total",
              cell: (row) => {
                if (!row.nilaiTotal) return <span className="text-red-500">-</span>;
                return (
                  <span className="font-bold text-green-700 text-base">
                    {row.nilaiTotal.toFixed(2)}
                  </span>
                );
              },
            },
            {
              header: "Kehadiran (%)",
              cell: (row) => {
                const persen = row.attendanceSummary?.persen ?? 0;
                const color = persen >= 80 ? "text-green-600" : persen >= 60 ? "text-yellow-600" : "text-red-600";
                return (
                  <span className={`font-semibold ${color}`}>
                    {persen.toFixed(1)}%
                  </span>
                );
              },
            },
            {
              header: "H / S / I / A",
              cell: (row) => (
                <div className="text-xs">
                  <span className="text-green-600 font-semibold">{row.attendanceSummary?.hadir ?? 0}</span>
                  {" / "}
                  <span className="text-yellow-600">{row.attendanceSummary?.sakit ?? 0}</span>
                  {" / "}
                  <span className="text-blue-600">{row.attendanceSummary?.izin ?? 0}</span>
                  {" / "}
                  <span className="text-red-600">{row.attendanceSummary?.alpa ?? 0}</span>
                </div>
              ),
            },
            {
              header: "Detail",
              cell: (row) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetail(row)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              ),
              className: "w-[80px]",
            },
            {
              header: "Status Naik",
              cell: (row) => (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!row.naikKelas}
                    onCheckedChange={(val) => handleSwitchChange(row.id, val)}
                  />
                  {row.naikKelas && (
                    <span className="text-xs text-green-600 font-semibold">✓ Naik</span>
                  )}
                </div>
              ),
            },
          ]}
          isLoading={isLoading}
          loadingMessage="Memuat data siswa..."
          emptyMessage="Belum ada siswa"
          keyExtractor={(s) => s.id}
        />

          {/* Summary & Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Summary Card */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border rounded-lg">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                📊 Ringkasan Status Kenaikan Kelas
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-slate-700">
                    {students.length}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Total Siswa</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-2xl font-bold text-green-700">
                    {students.filter((s) => s.naikKelas).length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">✅ Naik Kelas</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-2xl font-bold text-red-700">
                    {students.filter((s) => !s.naikKelas).length}
                  </p>
                  <p className="text-xs text-red-600 mt-1">❌ Tidak Naik</p>
                </div>
              </div>
              {students.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Persentase Naik:</span>
                    <span className="font-semibold text-green-700">
                      {((students.filter((s) => s.naikKelas).length / students.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="flex flex-col justify-center gap-3">
              <Button
                onClick={handlePromote}
                disabled={
                  students.length === 0 ||
                  !targetAcademicYearId ||
                  !targetClassIdForPassed
                }
                className="w-full h-full min-h-[100px] text-lg"
                size="lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">🎓</span>
                  <span>Proses Kenaikan Kelas</span>
                  <span className="text-xs opacity-75">
                    {students.filter((s) => s.naikKelas).length} siswa naik,{" "}
                    {students.filter((s) => !s.naikKelas).length} siswa tidak naik
                  </span>
                </div>
              </Button>
              {(!targetAcademicYearId || !targetClassIdForPassed) && (
                <p className="text-xs text-center text-red-600">
                  ⚠️ Pilih tahun ajaran dan kelas tujuan terlebih dahulu
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Detail Nilai & Kehadiran - {selectedStudent?.namaLengkap}
            </DialogTitle>
            <DialogDescription>
              Perbandingan nilai semester GANJIL dan GENAP serta kehadiran
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6 mt-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-900">
                      Nilai Semester GANJIL
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-700">
                      {selectedStudent.nilaiSemesterGanjil?.toFixed(2) ?? "-"}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Dari {selectedStudent.detailNilaiGanjil?.length ?? 0} mata pelajaran
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-purple-900">
                      Nilai Semester GENAP
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-700">
                      {selectedStudent.nilaiSemesterGenap?.toFixed(2) ?? "-"}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Dari {selectedStudent.detailNilaiGenap?.length ?? 0} mata pelajaran
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-900">
                      Nilai Total Gabungan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-700">
                      {selectedStudent.nilaiTotal?.toFixed(2) ?? "-"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getTrendIcon(
                        selectedStudent.nilaiSemesterGanjil,
                        selectedStudent.nilaiSemesterGenap
                      )}
                      <p className="text-xs text-green-600">
                        {selectedStudent.nilaiSemesterGanjil &&
                        selectedStudent.nilaiSemesterGenap
                          ? (
                              selectedStudent.nilaiSemesterGenap -
                              selectedStudent.nilaiSemesterGanjil
                            ).toFixed(2) > 0
                            ? `+${(
                                selectedStudent.nilaiSemesterGenap -
                                selectedStudent.nilaiSemesterGanjil
                              ).toFixed(2)} dari Ganjil`
                            : `${(
                                selectedStudent.nilaiSemesterGenap -
                                selectedStudent.nilaiSemesterGanjil
                              ).toFixed(2)} dari Ganjil`
                          : "Belum ada data"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detail Nilai Per Mata Pelajaran */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    📊 Perbandingan Nilai Per Mata Pelajaran
                  </CardTitle>
                  <CardDescription>
                    Nilai GANJIL vs GENAP untuk setiap mata pelajaran
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Gabungkan semua mata pelajaran dari kedua semester */}
                    {(() => {
                      const allSubjects = new Set([
                        ...(selectedStudent.detailNilaiGanjil?.map(
                          (n) => n.subject
                        ) ?? []),
                        ...(selectedStudent.detailNilaiGenap?.map(
                          (n) => n.subject
                        ) ?? []),
                      ]);

                      return Array.from(allSubjects).map((subject, idx) => {
                        const ganjilNilai = selectedStudent.detailNilaiGanjil?.find(
                          (n) => n.subject === subject
                        )?.nilai;
                        const genapNilai = selectedStudent.detailNilaiGenap?.find(
                          (n) => n.subject === subject
                        )?.nilai;

                        const diff =
                          ganjilNilai && genapNilai
                            ? genapNilai - ganjilNilai
                            : null;

                        return (
                          <div
                            key={idx}
                            className="p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-sm">
                                  {idx + 1}. {subject}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">
                                    Ganjil
                                  </p>
                                  <p className="font-semibold text-blue-700">
                                    {ganjilNilai?.toFixed(2) ?? "-"}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  {diff !== null && (
                                    <>
                                      {diff > 0 && (
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                      )}
                                      {diff < 0 && (
                                        <TrendingDown className="h-5 w-5 text-red-600" />
                                      )}
                                      {diff === 0 && (
                                        <Minus className="h-5 w-5 text-gray-400" />
                                      )}
                                    </>
                                  )}
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">
                                    Genap
                                  </p>
                                  <p className="font-semibold text-purple-700">
                                    {genapNilai?.toFixed(2) ?? "-"}
                                  </p>
                                </div>
                                <div className="text-center min-w-[60px]">
                                  <p className="text-xs text-muted-foreground">
                                    Selisih
                                  </p>
                                  <p
                                    className={`font-semibold ${
                                      diff && diff > 0
                                        ? "text-green-600"
                                        : diff && diff < 0
                                        ? "text-red-600"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {diff !== null
                                      ? diff > 0
                                        ? `+${diff.toFixed(2)}`
                                        : diff.toFixed(2)
                                      : "-"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Kehadiran */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    📅 Data Kehadiran Gabungan (Semester GANJIL + GENAP)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-2xl font-bold text-green-700">
                        {selectedStudent.attendanceSummary?.hadir ?? 0}
                      </p>
                      <p className="text-xs text-green-600 font-medium">Hadir</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-2xl font-bold text-yellow-700">
                        {selectedStudent.attendanceSummary?.sakit ?? 0}
                      </p>
                      <p className="text-xs text-yellow-600 font-medium">Sakit</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-2xl font-bold text-blue-700">
                        {selectedStudent.attendanceSummary?.izin ?? 0}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">Izin</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-2xl font-bold text-red-700">
                        {selectedStudent.attendanceSummary?.alpa ?? 0}
                      </p>
                      <p className="text-xs text-red-600 font-medium">Alpa</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-2xl font-bold text-slate-700">
                        {selectedStudent.attendanceSummary?.persen?.toFixed(1) ??
                          0}
                        %
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        Persentase
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailDialog(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
