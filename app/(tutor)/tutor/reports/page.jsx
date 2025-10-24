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
  GraduationCap,
  BookOpen,
  Loader2,
} from "lucide-react";

export default function TutorReportsPage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(false);

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
      } catch (err) {
        toast.error("Gagal memuat tahun ajaran");
      }
    };

    fetchAcademicYears();
  }, []);

  // Fetch tutor's classes and subjects
  useEffect(() => {
    if (selectedAcademicYear) {
      fetchClassesAndSubjects();
    }
  }, [selectedAcademicYear]);

  const fetchClassesAndSubjects = async () => {
    try {
      const res = await api.get("/tutor/my-classes-subjects", {
        params: { academicYearId: selectedAcademicYear },
      });

      if (res.data.success) {
        setClasses(res.data.data.classes || []);
        setSubjects(res.data.data.subjects || []);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
      toast.error("Gagal memuat data kelas dan mata pelajaran");
    }
  };

  // Download handlers
  const downloadSubjectScoresReport = async (format) => {
    if (!selectedClass || !selectedSubject) {
      toast.error("Pilih kelas dan mata pelajaran terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/tutor/reports/subject-scores", {
        params: {
          academicYearId: selectedAcademicYear,
          classId: selectedClass,
          subjectId: selectedSubject,
          format,
        },
        responseType: "blob",
      });

      const selectedYear = academicYears.find((y) => y.id === selectedAcademicYear);
      const selectedClassName = classes.find((c) => c.id === selectedClass)?.namaKelas;
      const selectedSubjectName = subjects.find((s) => s.id === selectedSubject)?.namaMapel;

      const filename = `laporan-nilai-${selectedSubjectName?.replace(/\s+/g, "-")}-${selectedClassName}-${selectedYear?.tahunMulai}-${selectedYear?.semester}.${format}`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(
        `Laporan nilai mata pelajaran berhasil diunduh (${format.toUpperCase()})`
      );
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Gagal mengunduh laporan nilai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Laporan Tutor"
        description="Cetak laporan nilai mata pelajaran yang Anda ampu dalam format PDF atau Excel"
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Laporan" },
        ]}
      />

      <Tabs defaultValue="subject-scores" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="subject-scores">
            <BookOpen className="h-4 w-4 mr-2" />
            Laporan Nilai Per Mata Pelajaran
          </TabsTrigger>
        </TabsList>

        {/* Laporan Nilai Mata Pelajaran */}
        <TabsContent value="subject-scores">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Nilai Mata Pelajaran</CardTitle>
              <CardDescription>
                Unduh rekap nilai siswa per mata pelajaran yang Anda ampu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <SelectContent>
                      {academicYears.map((y) => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.tahunMulai}/{y.tahunSelesai} - {y.semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Kelas</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.namaKelas}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Mata Pelajaran
                  </label>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mata pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.namaMapel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => downloadSubjectScoresReport("pdf")}
                  disabled={
                    loading || !selectedAcademicYear || !selectedClass || !selectedSubject
                  }
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
                  onClick={() => downloadSubjectScoresReport("xlsx")}
                  disabled={
                    loading || !selectedAcademicYear || !selectedClass || !selectedSubject
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
