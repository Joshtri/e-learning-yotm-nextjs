"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
      setClasses(res.data.data || []);
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

      <div className="flex justify-end">
        <Select value={selectedYearId} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.tahunMulai}/{year.tahunSelesai}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas yang Diampu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Mapel</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Tidak ada kelas yang diampu
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.class.namaKelas}</TableCell>
                      <TableCell>{item.class.program.namaPaket}</TableCell>
                      <TableCell>{`${item.class.academicYear.tahunMulai}/${item.class.academicYear.tahunSelesai}`}</TableCell>
                      <TableCell>{item.subject.namaMapel}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() =>
                            handleBeriNilaiSkill(item.class.id, item.subject.id)
                          }
                        >
                          Beri Nilai Skill
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
