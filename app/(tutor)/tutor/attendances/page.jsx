// Halaman daftar kelas dan mata pelajaran untuk melihat presensi per kombinasi kelas & mapel
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Calendar, Users, Eye, Filter, Info } from "lucide-react";
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
    } catch {
      toast.error("Gagal memuat tahun ajaran");
    }
  };

  const fetchClasses = async (academicYearId) => {
    setIsLoading(true);
    try {
      const res = await api.get("/tutor/my-classes", {
        params: { academicYearId },
      });
      const rawData = res.data.data || [];

      // Group by class ID to merge subjects for the same class
      const groupedMap = {};
      rawData.forEach((item) => {
        const clsId = item.class.id;
        if (!groupedMap[clsId]) {
          groupedMap[clsId] = {
            ...item.class,
            taughtSubjects: [],
          };
        }
        if (item.subject) {
          // Avoid duplicate subjects if any
          const exists = groupedMap[clsId].taughtSubjects.find(
            (s) => s.id === item.subject.id,
          );
          if (!exists) {
            groupedMap[clsId].taughtSubjects.push({
              ...item.subject,
              cstId: item.id,
            });
          }
        }
      });

      setClasses(Object.values(groupedMap));
    } catch {
      toast.error("Gagal memuat kelas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Presensi Kelas"
        description="Kelola presensi siswa berdasarkan kelas yang Anda ajar."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Presensi", href: "/tutor/attendances" },
          { label: "Per Kelas" },
        ]}
      />

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Presensi dikelola per <strong>kelas</strong>. Setiap kelas memiliki
          daftar presensi tersendiri untuk semua siswa di kelas tersebut.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard
          title="Total Kelas"
          value={classes.length}
          description="Kelas yang Anda ajar"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Tahun Ajaran"
          value={
            academicYears.find((y) => y.id === selectedYearId)
              ? `${
                  academicYears.find((y) => y.id === selectedYearId).tahunMulai
                }/${
                  academicYears.find((y) => y.id === selectedYearId)
                    .tahunSelesai
                } - ${
                  academicYears.find((y) => y.id === selectedYearId).semester
                }`
              : "-"
          }
          description="Periode tahun ajaran"
          icon={<Calendar className="h-4 w-4" />}
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
              <CardDescription>
                Pilih tahun ajaran untuk melihat daftar kelas dan mata pelajaran
              </CardDescription>
            </div>
            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Pilih Tahun Ajaran" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.tahunMulai}/{year.tahunSelesai} - {year.semester}{" "}
                    {year.isActive && (
                      <Badge variant="default" className="ml-2">
                        Aktif
                      </Badge>
                    )}
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
            Daftar Kelas
          </CardTitle>
          <CardDescription>
            {classes.length} kelas tersedia. Kelola presensi siswa untuk setiap
            kelas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable numRows={5} numCols={4} showHeader={true} />
          ) : classes.length === 0 ? (
            <EmptyState
              title="Tidak ada kelas"
              description="Belum ada kelas yang Anda ampu untuk tahun ajaran ini."
              icon={<Users className="h-6 w-6 text-muted-foreground" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.flatMap((cls) => {
                const items = [];
                // 1. Homeroom Card
                {
                  /* if (cls.isHomeroom) {
                  items.push(
                    <Card
                      key={`${cls.id}-homeroom`}
                      className="hover:shadow-lg transition-shadow border-amber-200 bg-amber-50/30"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex flex-col gap-2">
                          <Badge className="w-fit bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                            Wali Kelas
                          </Badge>
                          <CardTitle className="text-lg">
                            {cls.namaKelas}
                          </CardTitle>
                          <p className="text-sm text-slate-500">
                            {cls.program?.namaPaket}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Tahun Ajaran
                            </span>
                            <span>
                              {cls.academicYear.tahunMulai}/
                              {cls.academicYear.tahunSelesai}
                            </span>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() =>
                              router.push(`/tutor/attendances/class/${cls.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" /> Kelola Presensi
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                } */
                }
                // 2. Subject Cards
                if (cls.taughtSubjects && cls.taughtSubjects.length > 0) {
                  cls.taughtSubjects.forEach((sub) => {
                    items.push(
                      <Card
                        key={`${cls.id}-${sub.id}`}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex flex-col gap-2">
                            <Badge className="w-fit bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                              {sub.namaMapel}
                            </Badge>
                            <CardTitle className="text-lg">
                              {cls.namaKelas}
                            </CardTitle>
                            <p className="text-sm text-slate-500">
                              {cls.program?.namaPaket}
                            </p>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Tahun Ajaran
                              </span>
                              <span>
                                {cls.academicYear.tahunMulai}/
                                {cls.academicYear.tahunSelesai}
                              </span>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() =>
                                router.push(
                                  `/tutor/attendances/class/${cls.id}?subjectId=${sub.id}`,
                                )
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" /> Kelola Presensi
                            </Button>
                          </div>
                        </CardContent>
                      </Card>,
                    );
                  });
                }
                return items;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
