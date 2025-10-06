"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Users } from "lucide-react";
import { AcademicYearFilter } from "@/components/AcademicYearFilter";
// import AcademicYearFilter from "@/components/AcademicYearFilter";

export default function FinalScoresPage() {
  const [data, setData] = useState({ students: [], subjects: [], tahunAjaranId: null, classInfo: null, filterOptions: { academicYears: [] } });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");

  // Helper function untuk format angka ke 2 desimal
  const formatNumber = (value) => {
    if (value == null || value === "" || value === "-") return "-";
    const num = typeof value === "number" ? value : parseFloat(value);
    return isNaN(num) ? "-" : num.toFixed(2);
  };

  const fetchFinalScores = useCallback(async (academicYearId) => {
    try {
      setIsLoading(true);
      const params = academicYearId ? { academicYearId } : {};
      const res = await api.get("/homeroom/final-scores", { params });
      setData(res.data.data || { students: [], subjects: [], classInfo: null, filterOptions: { academicYears: [] } });
      if (res.data.data?.classInfo?.academicYear?.id && !academicYearId) {
        setSelectedYear(res.data.data.classInfo.academicYear.id);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Gagal memuat data nilai akhir siswa";
      toast.error(errorMessage);
      setData({ students: [], subjects: [], classInfo: null, filterOptions: { academicYears: [] } });
      if (error.response?.data?.data?.filterOptions) {
        setData(prevData => ({ ...prevData, filterOptions: error.response.data.data.filterOptions }));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinalScores();
  }, [fetchFinalScores]);

  const handleYearChange = (yearId) => {
    setSelectedYear(yearId);
    fetchFinalScores(yearId);
  };

  const handleOpenConfirmDialog = () => {
    if (!data.tahunAjaranId) {
      toast.error("Data tahun ajaran tidak ditemukan.");
      return;
    }

    if (data.students.length === 0) {
      toast.warning("Tidak ada data siswa untuk disimpan.");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleSaveFinalScores = async () => {
    try {
      setIsSaving(true);
      const payload = [];

      data.students.forEach((student) => {
        data.subjects.forEach((subject) => {
          const mapel = student.mapelDetails.find(
            (m) => m.namaMapel === subject.namaMapel
          );

          if (!mapel) return;

          const komponen = [
            mapel.exercise,
            mapel.quiz,
            mapel.dailyTest,
            mapel.midterm,
            mapel.finalExam,
            mapel.skill,
          ];

          const nilaiList = komponen
            .map((n) => (typeof n === "number" ? n : parseFloat(n)))
            .filter((n) => !isNaN(n));

          if (nilaiList.length === 0) return;

          const nilaiAkhir = (
            nilaiList.reduce((acc, n) => acc + n, 0) / nilaiList.length
          );

          payload.push({
            studentId: student.id,
            subjectId: subject.id,
            tahunAjaranId: data.tahunAjaranId,
            nilaiAkhir: parseFloat(nilaiAkhir.toFixed(2)),
          });
        });
      });

      if (payload.length === 0) {
        toast.warning("Tidak ada data nilai akhir yang valid untuk disimpan.");
        setShowConfirmDialog(false);
        return;
      }

      await api.post("/homeroom/final-scores/save", { finalScores: payload });
      toast.success("Nilai akhir berhasil disimpan.");
      setShowConfirmDialog(false);
      fetchFinalScores(selectedYear); // Refresh data setelah simpan
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan nilai akhir");
    } finally {
      setIsSaving(false);
    }
  };
  
  

  const classInfo = data.classInfo;

  return (
    <div className="p-6">
      <PageHeader
        title="Perhitungan Nilai Akhir"
        description="Data nilai lengkap: Kuis, Tugas, UTS, UAS, Daily Test, Skill, Behavior."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Perhitungan Nilai Akhir" },
        ]}
      >
        <AcademicYearFilter
          academicYears={(data.filterOptions?.academicYears || []).map(y => ({ ...y, value: y.id, label: y.label }))}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />
      </PageHeader>

      {/* Info Kelas & Tahun Ajaran */}
      {!isLoading && classInfo && (
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Informasi Kelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Kelas</p>
                <p className="text-lg font-bold text-gray-900">
                  {classInfo.namaKelas}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="text-lg font-bold text-gray-900">
                  {classInfo.program || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tahun Ajaran</p>
                <p className="text-lg font-bold text-gray-900">
                  {classInfo.academicYear.tahunMulai}/
                  {classInfo.academicYear.tahunSelesai}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semester</p>
                <p className="text-lg font-bold">
                  <span
                    className={`px-3 py-1 rounded-md text-sm ${
                      classInfo.academicYear.semester === "GENAP"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {classInfo.academicYear.semester}
                  </span>
                  {classInfo.academicYear.isActive && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                      Aktif
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Rekap Nilai Siswa</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="text-center">
                    No
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Nama
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Kelas
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Program
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Tahun Ajaran
                  </TableHead>

                  {data.subjects.map((subject) => (
                    <TableHead
                      key={subject.id}
                      colSpan={6}
                      className="text-center font-bold"
                    >
                      {subject.namaMapel}
                    </TableHead>
                  ))}

                  <TableHead rowSpan={2} className="text-center">
                    Spiritual
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Sosial
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Kehadiran
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Total Nilai
                  </TableHead>
                </TableRow>

                <TableRow>
                  {data.subjects.map((_) => (
                    <>
                      <TableHead className="text-xs text-center">
                        Exercise
                      </TableHead>
                      <TableHead className="text-xs text-center">
                        Quiz
                      </TableHead>
                      <TableHead className="text-xs text-center">
                        Daily Test
                      </TableHead>
                      <TableHead className="text-xs text-center">
                        Midterm
                      </TableHead>
                      <TableHead className="text-xs text-center">
                        Final
                      </TableHead>
                      <TableHead className="text-xs text-center">
                        Skill
                      </TableHead>
                    </>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data.students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center">
                      Tidak ada data siswa
                    </TableCell>
                  </TableRow>
                ) : (
                  data.students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{student.namaLengkap}</TableCell>
                      <TableCell>{student.kelas}</TableCell>
                      <TableCell>{student.program}</TableCell>
                      <TableCell>{student.tahunAjaran}</TableCell>

                      {data.subjects.map((subject) => {
                        const mapel = student.mapelDetails.find(
                          (m) => m.namaMapel === subject.namaMapel
                        ) || {
                          exercise: "-",
                          quiz: "-",
                          dailyTest: "-",
                          midterm: "-",
                          finalExam: "-",
                          skill: "-",
                        };

                        return (
                          <>
                            <TableCell>{formatNumber(mapel.exercise)}</TableCell>
                            <TableCell>{formatNumber(mapel.quiz)}</TableCell>
                            <TableCell>{formatNumber(mapel.dailyTest)}</TableCell>
                            <TableCell>{formatNumber(mapel.midterm)}</TableCell>
                            <TableCell>{formatNumber(mapel.finalExam)}</TableCell>
                            <TableCell>{formatNumber(mapel.skill)}</TableCell>
                          </>
                        );
                      })}

                      <TableCell>
                        {formatNumber(student.behavior?.spiritual)}
                      </TableCell>
                      <TableCell>{formatNumber(student.behavior?.sosial)}</TableCell>
                      <TableCell>
                        {formatNumber(student.behavior?.kehadiran)}
                      </TableCell>

                      <TableCell className="font-bold">
                        {formatNumber(student.nilaiAkhir)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between mt-4 gap-2 flex-wrap">
            <Button variant="outline" onClick={() => fetchFinalScores(selectedYear)} disabled={isSaving}>
              Refresh Data
            </Button>
            <Button onClick={handleOpenConfirmDialog} disabled={isSaving}>
              Simpan Nilai Akhir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleSaveFinalScores}
        title="Konfirmasi Simpan Nilai Akhir"
        description={`Anda akan menyimpan nilai akhir untuk ${data.students.length} siswa. Data yang sudah disimpan akan menimpa nilai sebelumnya. Apakah Anda yakin?`}
        confirmText="Ya, Simpan"
        cancelText="Batal"
        isLoading={isSaving}
      />
    </div>
  );
}
