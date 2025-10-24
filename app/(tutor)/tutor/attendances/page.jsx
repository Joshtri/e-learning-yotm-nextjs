// Halaman daftar kelas dan mata pelajaran untuk melihat presensi per kombinasi kelas & mapel
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SkeletonTable from "@/components/ui/skeleton/SkeletonTable";
import { Calendar, Users, BookOpen, Eye, Filter, Info } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AttendanceClassListPage() {
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      fetchClasses(selectedYearId);
    }
  }, [selectedYearId]);

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years");
      const list = res.data?.data?.academicYears || [];
      setAcademicYears(list);

      const active = list.find((y) => y.isActive);
      if (active) setSelectedYearId(active.id);
    } catch (error) {
      toast.error("Gagal memuat tahun ajaran");
    }
  };

  const fetchClasses = async (academicYearId) => {
    setIsLoading(true);
    try {
      const res = await api.get("/tutor/my-classes", {
        params: { academicYearId },
      });
      setClasses(res.data.data || []);
    } catch (error) {
      toast.error("Gagal memuat kelas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Presensi Kelas & Mata Pelajaran"
        description="Kelola presensi siswa berdasarkan kelas dan mata pelajaran yang Anda ajar. Setiap kombinasi kelas dan mata pelajaran memiliki daftar presensi terpisah."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Presensi", href: "/tutor/attendances" },
          { label: "Per Kelas & Mapel" },
        ]}
      />

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Presensi dikelola per <strong>kombinasi kelas dan mata pelajaran</strong>. Jika Anda mengajar beberapa mata pelajaran di kelas yang sama, masing-masing akan memiliki daftar presensi terpisah. Ini memastikan setiap siswa dapat memiliki catatan kehadiran berbeda untuk setiap mata pelajaran.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Kelas & Mapel"
          value={classes.length}
          description="Kombinasi kelas dan mata pelajaran"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Tahun Ajaran"
          value={
            academicYears.find((y) => y.id === selectedYearId)
              ? `${academicYears.find((y) => y.id === selectedYearId).tahunMulai}/${
                  academicYears.find((y) => y.id === selectedYearId).tahunSelesai
                } - ${academicYears.find((y) => y.id === selectedYearId).semester}`
              : "-"
          }
          description="Periode tahun ajaran"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatsCard
          title="Mata Pelajaran"
          value={new Set(classes.map((c) => c.subject.namaMapel)).size}
          description="Total mapel yang diampu"
          icon={<BookOpen className="h-4 w-4" />}
        />
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Tahun Ajaran
              </CardTitle>
              <CardDescription>Pilih tahun ajaran untuk melihat daftar kelas dan mata pelajaran</CardDescription>
            </div>
            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Pilih Tahun Ajaran" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.tahunMulai}/{year.tahunSelesai} - {year.semester}{" "}
                    {year.isActive && <Badge variant="default" className="ml-2">Aktif</Badge>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Class List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Kelas & Mata Pelajaran
          </CardTitle>
          <CardDescription>
            {classes.length} kombinasi kelas dan mata pelajaran tersedia. Setiap kartu di bawah mewakili presensi untuk satu mata pelajaran di satu kelas tertentu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable numRows={5} numCols={4} showHeader={true} />
          ) : classes.length === 0 ? (
            <EmptyState
              title="Tidak ada kelas & mata pelajaran"
              description="Belum ada kelas dan mata pelajaran yang Anda ampu untuk tahun ajaran ini."
              icon={<Users className="h-6 w-6 text-muted-foreground" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((item, index) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 w-full">
                        <Badge variant="outline" className="w-fit">
                          Kelas & Mapel #{index + 1}
                        </Badge>
                        <CardTitle className="text-lg">
                          {item.class.namaKelas}
                        </CardTitle>
                        <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {item.subject.namaMapel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Tahun Ajaran
                        </span>
                        <span className="font-medium">
                          {item.class.academicYear.tahunMulai}/
                          {item.class.academicYear.tahunSelesai} - {item.class.academicYear.semester}
                        </span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() =>
                          router.push(
                            `/tutor/attendances/class/${item.class.id}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Kelola Presensi
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
