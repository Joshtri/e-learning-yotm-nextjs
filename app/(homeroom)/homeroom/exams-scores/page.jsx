"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, FileX, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AcademicYearFilter } from "@/components/AcademicYearFilter";
// import AcademicYearFilter from "@/components/AcademicYearFilter";

export default function HomeroomExamsScoresPage() {
  const [data, setData] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({ academicYears: [] });
  const [selectedYear, setSelectedYear] = useState("");

  // Helper function untuk format angka ke 2 desimal
  const formatNumber = (value) => {
    if (value == null || value === "" || value === "-") return "-";
    const num = typeof value === "number" ? value : parseFloat(value);
    return isNaN(num) ? "-" : num.toFixed(2);
  };

  const fetchData = useCallback(async (academicYearId) => {
    try {
      setIsLoading(true);
      const params = academicYearId ? { academicYearId } : {};
      const res = await api.get("/homeroom/exams-scores", { params });

      setData(res.data.data || []);
      setClassInfo(res.data.classInfo || null);
      if (res.data.filterOptions) {
        setFilterOptions(res.data.filterOptions);
      }
      if (res.data.classInfo?.academicYear?.id && !academicYearId) {
        setSelectedYear(res.data.classInfo.academicYear.id);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Gagal memuat rekap nilai ujian";
      toast.error(errorMessage);
      setData([]);
      setClassInfo(null);
      if (error.response?.data?.filterOptions) {
        setFilterOptions(error.response.data.filterOptions);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleYearChange = (yearId) => {
    setSelectedYear(yearId);
    fetchData(yearId);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Rekap Nilai Ujian"
        description="Pantau nilai ujian siswa di kelas Anda."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Rekap Nilai Ujian" },
        ]}
        icon={<BarChart3 className="h-6 w-6" />}
      >
        <AcademicYearFilter
          academicYears={filterOptions.academicYears}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />
      </PageHeader>

      {/* Info Kelas & Tahun Ajaran */}
      {!isLoading && classInfo && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
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

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : data.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileX className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Data Nilai Ujian</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Belum ada data nilai ujian untuk siswa di kelas Anda pada tahun ajaran yang dipilih. Nilai ujian akan muncul setelah tutor menilai submission siswa.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Pastikan siswa sudah mengerjakan ujian dan tutor sudah memberikan nilai</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {data.map((student) => (
            <AccordionItem key={student.studentId} value={student.studentId}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{student.namaLengkap}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead className="text-center">Ujian Harian</TableHead>
                      <TableHead className="text-center">Ujian Awal Semester</TableHead>
                      <TableHead className="text-center">Ujian Tengah Semester</TableHead>
                      <TableHead className="text-center">Ujian Akhir Semester</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.mapel && student.mapel.length > 0 ? (
                      student.mapel.map((subject, idx) => (
                        <TableRow key={`${subject.mataPelajaran}-${idx}`}>
                          <TableCell className="font-medium">{subject.mataPelajaran}</TableCell>
                          <TableCell className="text-center">
                            {formatNumber(subject.DAILY_TEST)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatNumber(subject.START_SEMESTER_TEST)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatNumber(subject.MIDTERM)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatNumber(subject.FINAL_EXAM)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          <FileX className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                          Tidak ada data nilai untuk siswa ini
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
