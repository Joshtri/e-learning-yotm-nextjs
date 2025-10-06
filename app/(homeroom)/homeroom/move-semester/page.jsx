"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  CalendarCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MoveSemesterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [validation, setValidation] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  useEffect(() => {
    fetchValidation();
    fetchAcademicYears();
  }, []);

  const fetchValidation = async () => {
    try {
      const res = await api.get("/homeroom/validate-semester-completion");
      setValidation(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat validasi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/homeroom/available-academic-years");
      const years = res.data.data || [];
      setAcademicYears(years);

      // Auto-select jika hanya ada 1 pilihan
      if (years.length === 1) {
        setSelectedAcademicYearId(years[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat tahun akademik");
    }
  };

  const handleOpenConfirmDialog = () => {
    if (!selectedAcademicYearId) {
      toast.error("Pilih tahun akademik tujuan terlebih dahulu");
      return;
    }

    if (!validation?.validation?.allValid) {
      toast.error(
        "Tidak bisa memindahkan siswa karena ada nilai yang belum lengkap"
      );
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleMove = async () => {
    try {
      setIsMoving(true);
      const res = await api.post("/homeroom/move-to-new-semester", {
        targetAcademicYearId: selectedAcademicYearId,
      });

      toast.success(res.data.message);
      setShowConfirmDialog(false);
      router.push("/homeroom/dashboard");
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.response?.data?.message || "Gagal memindahkan siswa";

      // Jika ada detail siswa yang invalid, tampilkan di dialog
      if (error.response?.data?.invalidStudents) {
        setErrorDetails({
          message: errorMsg,
          students: error.response.data.invalidStudents,
        });
        setShowErrorDialog(true);
        setShowConfirmDialog(false);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsMoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Pindah ke Semester Baru"
          description="Loading..."
          breadcrumbs={[
            { label: "Dashboard", href: "/homeroom/dashboard" },
            { label: "Pindah Semester" },
          ]}
        />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const allValid = validation?.validation?.allValid;
  const currentClass = validation?.classInfo;
  const selectedYear = academicYears.find(
    (y) => y.id === selectedAcademicYearId
  );

  // Filter tahun akademik: hanya yang berbeda dari current
  const availableYears = academicYears.filter(
    (y) => y.id !== currentClass?.academicYear?.id
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Pindah ke Semester Baru"
        description="Pindahkan siswa ke tahun akademik / semester baru"
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Pindah Semester" },
        ]}
      />

      {/* Info Kelas Saat Ini */}
      {currentClass && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Kelas Saat Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Kelas</p>
                <p className="font-semibold">
                  {currentClass.namaKelas} ({currentClass.program})
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tahun Ajaran</p>
                <p className="font-semibold">
                  {currentClass.academicYear.tahunMulai}/
                  {currentClass.academicYear.tahunSelesai}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semester</p>
                <p className="font-semibold">
                  <span
                    className={`px-2 py-1 rounded-md text-sm ${
                      currentClass.academicYear.semester === "GENAP"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {currentClass.academicYear.semester}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Validasi */}
      {allValid ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-900 font-semibold">
            Semua Nilai Lengkap
          </AlertTitle>
          <AlertDescription className="text-green-700">
            <p>
              Semua siswa sudah memiliki nilai UTS, UAS, dan Nilai Sikap yang
              lengkap. Anda dapat memindahkan siswa ke semester baru.
            </p>
            <div className="mt-2 text-sm">
              <strong>Total Siswa:</strong>{" "}
              {validation.validation.totalStudents} | <strong>Valid:</strong>{" "}
              {validation.validation.validStudents}
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <XCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-900 font-semibold">
            Ada Nilai yang Belum Lengkap
          </AlertTitle>
          <AlertDescription className="text-red-700">
            <p className="mb-2">
              Tidak bisa memindahkan siswa karena ada{" "}
              {validation.validation.invalidStudents} siswa yang nilainya belum
              lengkap.
            </p>
            <div className="text-sm">
              <strong>Total Siswa:</strong>{" "}
              {validation.validation.totalStudents} | <strong>Valid:</strong>{" "}
              {validation.validation.validStudents} |{" "}
              <strong>Belum Valid:</strong>{" "}
              {validation.validation.invalidStudents}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Daftar Siswa dengan Status Validasi */}
      <Card>
        <CardHeader>
          <CardTitle>Status Validasi Per Siswa</CardTitle>
          <CardDescription className="text-sm">
            Daftar semua siswa beserta status kelengkapan nilai mereka
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {validation?.students?.map((student, studentIdx) => (
              <div
                key={student.studentId}
                className={`p-4 rounded-lg border ${
                  student.isValid
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="space-y-3">
                  {/* Header Siswa */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-base">
                        {student.isValid ? (
                          <CheckCircle className="inline h-5 w-5 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="inline h-5 w-5 text-red-600 mr-2" />
                        )}
                        {studentIdx + 1}. {student.namaLengkap}
                      </p>
                      <p className="text-sm text-muted-foreground ml-7">
                        NISN: {student.nisn || "-"}
                      </p>
                    </div>
                    {student.isValid && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        ✓ Lengkap
                      </span>
                    )}
                  </div>

                  {/* Detail Issues */}
                  {!student.isValid && student.issues?.length > 0 && (
                    <div className="ml-7 space-y-2">
                      {student.issues.map((issue, idx) => {
                        // Handle both string and object format
                        const isObjectIssue = typeof issue === "object";
                        const issueMessage = isObjectIssue
                          ? issue.message
                          : issue;
                        const issueDetail = isObjectIssue ? issue.detail : null;
                        const issueType = isObjectIssue ? issue.type : null;
                        const issueMissing = isObjectIssue
                          ? issue.missing
                          : null;

                        return (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-md border border-red-200"
                          >
                            {/* Issue Header */}
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-red-500 font-bold mt-0.5">
                                •
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-red-900">
                                  {issueType === "UTS" && "📝 Nilai UTS"}
                                  {issueType === "UAS" && "📝 Nilai UAS"}
                                  {issueType === "BEHAVIOR" &&
                                    "😊 Nilai Sikap & Kehadiran"}
                                  {issueType === "FINAL_SCORE" &&
                                    "📊 Nilai Akhir"}
                                  {!issueType && "⚠️ Permasalahan"}
                                </p>
                                <p className="text-sm text-red-700 mt-1">
                                  {issueMessage}
                                </p>
                              </div>
                            </div>

                            {/* Detail Mata Pelajaran yang Kurang */}
                            {issueMissing && issueMissing.length > 0 && (
                              <div className="ml-6 mt-2 p-2 bg-red-50 rounded border border-red-100">
                                <p className="text-xs font-semibold text-red-900 mb-1">
                                  Mata Pelajaran yang Belum Lengkap:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {issueMissing.map((subj, subjIdx) => (
                                    <span
                                      key={subjIdx}
                                      className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded"
                                    >
                                      {subj.nama}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Detail Text (jika ada) */}
                            {issueDetail && !issueMissing && (
                              <div className="ml-6 mt-2 p-2 bg-red-50 rounded border border-red-100">
                                <p className="text-xs text-red-700">
                                  {issueDetail}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pilih Tahun Akademik Tujuan */}
      {allValid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Pilih Tahun Akademik Tujuan
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Pindahkan siswa ke semester GENAP di tahun ajaran yang sama.
              Pastikan admin sudah membuat tahun akademik semester GENAP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {academicYears.length === 0 ? (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-900 font-semibold">
                  Tahun Akademik GENAP Belum Dibuat
                </AlertTitle>
                <AlertDescription className="text-red-700">
                  Admin belum membuat tahun akademik semester GENAP untuk{" "}
                  {currentClass?.academicYear.tahunMulai}/
                  {currentClass?.academicYear.tahunSelesai}. Hubungi admin untuk
                  membuat tahun akademik tujuan terlebih dahulu.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Select
                  value={selectedAcademicYearId}
                  onValueChange={setSelectedAcademicYearId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Tahun Akademik Tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.tahunMulai}/{year.tahunSelesai} - Semester{" "}
                        {year.semester}
                        {year.isActive && " (Aktif)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedYear && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900">
                      Konfirmasi Pemindahan
                    </AlertTitle>
                    <AlertDescription className="text-blue-700">
                      <p>
                        Siswa akan dipindahkan dari{" "}
                        <strong>
                          {currentClass?.academicYear.tahunMulai}/
                          {currentClass?.academicYear.tahunSelesai} - Semester{" "}
                          {currentClass?.academicYear.semester}
                        </strong>{" "}
                        ke{" "}
                        <strong>
                          {selectedYear.tahunMulai}/{selectedYear.tahunSelesai} -
                          Semester {selectedYear.semester}
                        </strong>
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => router.back()}>
                    Batal
                  </Button>
                  <Button
                    onClick={handleOpenConfirmDialog}
                    disabled={!selectedAcademicYearId || isMoving}
                  >
                    Pindahkan Siswa
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleMove}
        title="Konfirmasi Pemindahan Siswa"
        description={`Anda akan memindahkan ${validation?.validation?.totalStudents || 0} siswa dari semester ${currentClass?.academicYear.semester} ke semester ${selectedYear?.semester}. Proses ini tidak dapat dibatalkan. Apakah Anda yakin?`}
        confirmText="Ya, Pindahkan Siswa"
        cancelText="Batal"
        isLoading={isMoving}
      />

      {/* Error Details Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Gagal Memindahkan Siswa
            </DialogTitle>
            <DialogDescription className="text-red-700 font-medium">
              {errorDetails?.message}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-900 font-semibold">
                Detail Siswa yang Bermasalah
              </AlertTitle>
              <AlertDescription className="text-red-700">
                Berikut adalah daftar siswa yang nilainya belum lengkap.
                Lengkapi nilai-nilai yang kurang sebelum memindahkan siswa ke
                semester baru.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {errorDetails?.students?.map((student, index) => (
                <Card key={student.id} className="border-red-200">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-base">
                            {index + 1}. {student.namaLengkap}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            NISN: {student.nisn || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Daftar Issues */}
                      {student.issues && student.issues.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {student.issues.map((issue, idx) => {
                            // Handle both string and object format
                            const isObjectIssue = typeof issue === "object";
                            const issueMessage = isObjectIssue
                              ? issue.message
                              : issue;
                            const issueDetail = isObjectIssue
                              ? issue.detail
                              : null;
                            const issueType = isObjectIssue ? issue.type : null;

                            return (
                              <div
                                key={idx}
                                className="bg-red-50 p-3 rounded-md border border-red-200"
                              >
                                <div className="flex items-start gap-2 mb-1">
                                  <span className="text-red-500 font-bold mt-0.5">
                                    •
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-900">
                                      {issueType === "FINAL_SCORE" &&
                                        "📊 Nilai Akhir"}
                                      {issueType === "BEHAVIOR" &&
                                        "😊 Nilai Sikap"}
                                      {issueType === "UTS" && "📝 Nilai UTS"}
                                      {issueType === "UAS" && "📝 Nilai UAS"}
                                      {!issueType && "⚠️ Permasalahan"}
                                    </p>
                                    <p className="text-sm text-red-700 mt-1">
                                      {issueMessage}
                                    </p>
                                    {issueDetail && (
                                      <div className="mt-2 p-2 bg-white rounded border border-red-100">
                                        <p className="text-xs text-red-600 font-medium">
                                          {issueDetail}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowErrorDialog(false)}
              >
                Tutup
              </Button>
              <Button
                onClick={() => {
                  setShowErrorDialog(false);
                  // Refresh validation untuk update data terbaru
                  fetchValidation();
                }}
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
