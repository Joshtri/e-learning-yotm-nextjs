"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, BookOpen, Calendar, Award, Edit, Filter } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { EmptyState } from "@/components/ui/empty-state";
import SkeletonTable from "@/components/ui/skeleton/SkeletonTable";

export default function TutorSkillScoresPage() {
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (academicYears.length > 0) {
      const active = academicYears.find((y) => y.isActive);
      const defaultYearId = selectedYearId || active?.id || "";
      setSelectedYearId(defaultYearId);
      fetchClasses(defaultYearId);
    }
  }, [academicYears]);

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years");
      setAcademicYears(res.data?.data?.academicYears || []);
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

      // Transform the response to flatten class-subject combinations
      const rawData = res.data.data || [];
      const flattened = rawData.flatMap((classItem) =>
        (classItem.taughtSubjects || []).map((subject) => ({
          id: `${classItem.id}_${subject.id}`,
          class: {
            id: classItem.id,
            namaKelas: classItem.namaKelas,
            academicYear: classItem.academicYear,
            program: classItem.program,
          },
          subject: {
            id: subject.id,
            namaMapel: subject.name,
          },
        }))
      );

      setClasses(flattened);
    } catch (error) {
      toast.error("Gagal memuat daftar kelas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (val) => {
    setSelectedYearId(val);
    fetchClasses(val);
  };

  const handleBeriNilaiSkill = (classId, subjectId) => {
    router.push(`/tutor/skill-scores/${classId}/${subjectId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Nilai Skill Siswa"
        description="Berikan nilai skill untuk siswa di kelas yang Anda ampu."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Nilai Skill" },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Kelas"
          value={classes.length}
          description="Kelas yang diampu"
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <StatsCard
          title="Mata Pelajaran"
          value={new Set(classes.map((c) => c.subject.namaMapel)).size}
          description="Mapel yang diajarkan"
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatsCard
          title="Tahun Ajaran"
          value={academicYears.find((y) => y.id === selectedYearId) 
            ? `${academicYears.find((y) => y.id === selectedYearId).tahunMulai}/${academicYears.find((y) => y.id === selectedYearId).tahunSelesai} - ${academicYears.find((y) => y.id === selectedYearId).semester}`
            : "-"}
          description="Periode yang dipilih"
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
              <CardDescription>Pilih tahun ajaran untuk melihat kelas</CardDescription>
            </div>
            <Select value={selectedYearId} onValueChange={handleYearChange}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Pilih Tahun Ajaran" />
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
        </CardHeader>
      </Card>

      {/* Class List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Daftar Kelas yang Diampu
          </CardTitle>
          <CardDescription>
            {classes.length} kelas tersedia untuk input nilai skill
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable numRows={5} numCols={5} showHeader={true} />
          ) : classes.length === 0 ? (
            <EmptyState
              title="Tidak ada kelas"
              description="Belum ada kelas yang tersedia untuk tahun ajaran ini."
              icon={<GraduationCap className="h-6 w-6 text-muted-foreground" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((item, index) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <Badge variant="secondary" className="mb-2">
                          Kelas {index + 1}
                        </Badge>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          {item.class.namaKelas}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {item.subject.namaMapel}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Program</p>
                          <Badge variant="outline" className="text-xs">
                            {item.class.program.namaPaket}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Tahun Ajaran
                          </p>
                          <p className="font-medium text-xs">
                            {item.class.academicYear.tahunMulai}/
                            {item.class.academicYear.tahunSelesai} - {item.class.academicYear.semester}
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() =>
                          handleBeriNilaiSkill(item.class.id, item.subject.id)
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Beri Nilai Skill
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
