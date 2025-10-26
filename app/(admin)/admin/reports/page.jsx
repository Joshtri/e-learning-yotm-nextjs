"use client";

import { useState, useEffect } from "react";
import {
  FileBarChart,
  Printer,
  Download,
  Info,
  Calendar,
  FileText,
  BookOpenCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState("attendance");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [loadingReport, setLoadingReport] = useState(false);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, overviewRes, academicYearsRes] = await Promise.all([
        fetch("/api/admin/dashboard/classes"),
        fetch("/api/admin/dashboard/overview"),
        fetch("/api/academic-years"),
      ]);

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData);
      }

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setCurrentAcademicYear(overviewData.currentAcademicYear);
      }

      if (academicYearsRes.ok) {
        const academicYearsData = await academicYearsRes.json();
        setAcademicYears(academicYearsData.data?.academicYears || []);

        // Set default to active year
        const activeYear = academicYearsData.data?.academicYears?.find(y => y.isActive);
        if (activeYear) {
          setSelectedAcademicYear(activeYear.id);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoadingReport(true);

      if (!selectedAcademicYear) {
        alert("Pilih tahun ajaran terlebih dahulu");
        setLoadingReport(false);
        return;
      }

      let url = "";
      const params = new URLSearchParams({
        academicYearId: selectedAcademicYear,
        format: reportFormat,
      });

      if (reportType === "attendance") {
        if (selectedClassId && selectedClassId !== "all") {
          params.append("classId", selectedClassId);
        }
        url = `/api/admin/reports/attendance?${params.toString()}`;
      } else if (reportType === "scores") {
        if (selectedClassId && selectedClassId !== "all") {
          params.append("classId", selectedClassId);
        }
        url = `/api/admin/reports/class-scores?${params.toString()}`;
      }

      console.log("Generating report with URL:", url);
      console.log("Selected Academic Year:", selectedAcademicYear);
      console.log("Report Type:", reportType);
      console.log("Format:", reportFormat);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate report");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `laporan-${reportType}.${reportFormat}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error generating report:", error);
      // alert(`Gagal membuat laporan: ${error.message}`);
    } finally {
      setLoadingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">

      <PageHeader
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Laporan Akademik" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Laporan Akademik</h1>
        <p className="text-gray-600 mt-2">
          Buat dan unduh berbagai laporan akademik
        </p>
      </div>

      {currentAcademicYear && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <Info className="h-5 w-5 text-blue-500 mr-2" />
          <p className="text-blue-700">
            Tahun Akademik Aktif: <strong>{currentAcademicYear.year} | Semester {currentAcademicYear.semester}</strong>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Report Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileBarChart className="h-5 w-5 mr-2" />
              Konfigurasi Laporan
            </CardTitle>
            <CardDescription>
              Pilih jenis laporan dan parameter yang diinginkan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Jenis Laporan</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">
                    Laporan Presensi Siswa
                  </SelectItem>
                  <SelectItem value="scores">
                    Laporan Rekap Nilai Siswa
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tahun Ajaran / Semester</label>
              <Select
                value={selectedAcademicYear}
                onValueChange={setSelectedAcademicYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.tahunMulai}/{year.tahunSelesai} - {year.semester}
                      {year.isActive && " (Aktif)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kelas</label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Format File</label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateReport}
              disabled={loadingReport || !selectedAcademicYear}
              className="w-full"
              size="lg"
            >
              {loadingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Membuat Laporan...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak Laporan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Report Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Laporan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <strong>Laporan Presensi:</strong> Menampilkan rekap
                    kehadiran siswa per semester dengan rincian hadir, sakit, izin,
                    dan alpha.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-700">
                    <strong>Laporan Nilai:</strong> Menampilkan rekap nilai
                    seluruh mata pelajaran beserta nilai spiritual dan sosial
                    siswa.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-700">
                    {currentAcademicYear ? (
                      <>
                        <strong>Tahun Akademik Aktif:</strong>{" "}
                        {currentAcademicYear.year} | Semester{" "}
                        {currentAcademicYear.semester}
                      </>
                    ) : (
                      <>Tidak ada tahun akademik yang aktif</>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Format File</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start">
                  <FileText className="h-4 w-4 mr-2 mt-0.5" />
                  <div>
                    <strong>PDF:</strong> Cocok untuk dicetak atau dibagikan
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="h-4 w-4 mr-2 mt-0.5" />
                  <div>
                    <strong>Excel:</strong> Dapat diedit dan dianalisis lebih
                    lanjut
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Laporan Cepat</CardTitle>
          <CardDescription>
            Akses cepat ke laporan yang sering digunakan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto flex flex-col items-start p-4"
              onClick={() => {
                setReportType("attendance");
                setSelectedClassId("all");
                setReportFormat("pdf");
                setTimeout(() => generateReport(), 100);
              }}
              disabled={loadingReport || !selectedAcademicYear}
            >
              <FileBarChart className="h-5 w-5 mb-2 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">Presensi Semester</div>
                <div className="text-xs text-gray-500">Semua Kelas</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex flex-col items-start p-4"
              onClick={() => {
                setReportType("scores");
                setSelectedClassId("all");
                setReportFormat("pdf");
                setTimeout(() => generateReport(), 100);
              }}
              disabled={loadingReport || !selectedAcademicYear}
            >
              <BookOpenCheck className="h-5 w-5 mb-2 text-green-500" />
              <div className="text-left">
                <div className="font-medium">Rekap Nilai</div>
                <div className="text-xs text-gray-500">Semua Kelas</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex flex-col items-start p-4"
              onClick={() => {
                setReportType("attendance");
                setSelectedClassId("all");
                setReportFormat("excel");
                setTimeout(() => generateReport(), 100);
              }}
              disabled={loadingReport || !selectedAcademicYear}
            >
              <Download className="h-5 w-5 mb-2 text-purple-500" />
              <div className="text-left">
                <div className="font-medium">Export Presensi</div>
                <div className="text-xs text-gray-500">Format Excel</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex flex-col items-start p-4"
              onClick={() => {
                setReportType("scores");
                setSelectedClassId("all");
                setReportFormat("excel");
                setTimeout(() => generateReport(), 100);
              }}
              disabled={loadingReport || !selectedAcademicYear}
            >
              <Download className="h-5 w-5 mb-2 text-amber-500" />
              <div className="text-left">
                <div className="font-medium">Export Nilai</div>
                <div className="text-xs text-gray-500">Format Excel</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
