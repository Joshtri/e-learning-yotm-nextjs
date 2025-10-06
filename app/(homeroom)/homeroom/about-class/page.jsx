"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import api from "@/lib/axios";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// import AcademicYearFilter from "@/components/AcademicYearFilter";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { AcademicYearFilter } from "@/components/AcademicYearFilter";

const getStatusVariant = (status) => {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "GRADUATED":
      return "secondary";
    case "TRANSFERRED":
      return "outline";
    case "DROPPED_OUT":
      return "destructive";
    case "DECEASED":
      return "destructive";
    default:
      return "outline";
  }
};

export default function AboutClassPage() {
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({ academicYears: [] });
  const [selectedYear, setSelectedYear] = useState("");

  const fetchClassData = useCallback(async (academicYearId) => {
    setIsLoading(true);
    try {
      const params = academicYearId ? { academicYearId } : {};
      const res = await api.get("/homeroom/about-class", { params });
      setClassData(res.data.data);
      if (res.data.filterOptions) {
        setFilterOptions(res.data.filterOptions);
      }
      if (res.data.data?.academicYear?.id && !academicYearId) {
        setSelectedYear(res.data.data.academicYear.id);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Gagal memuat data kelas";
      toast.error(errorMessage);
      setClassData(null); // Clear data on error
      if (error.response?.data?.filterOptions) {
        setFilterOptions(error.response.data.filterOptions);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const handleYearChange = (yearId) => {
    setSelectedYear(yearId);
    fetchClassData(yearId);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Tentang Kelas" description="Memuat data kelas..." />
        <div className="space-y-4 mt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tentang Kelas"
        description="Semua informasi penting tentang kelas ini."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Tentang Kelas" },
        ]}
      >
        <AcademicYearFilter
          academicYears={filterOptions.academicYears}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />
      </PageHeader>

      {!classData ? (
        <EmptyState
          title="Data Kelas Tidak Ditemukan"
          description="Tidak ada data kelas yang ditemukan untuk tahun ajaran yang dipilih. Silakan pilih tahun ajaran lain atau hubungi admin jika Anda seharusnya memiliki kelas."
          icon={<Users className="h-12 w-12 text-muted-foreground" />}
        />
      ) : (
        <>
          {/* Card Info Umum */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Umum Kelas</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold">Nama Kelas</h4>
                <p>{classData.namaKelas}</p>
              </div>
              <div>
                <h4 className="font-semibold">Program</h4>
                <p>{classData.program.namaPaket}</p>
              </div>
              <div>
                <h4 className="font-semibold">Tahun Ajaran & Semester</h4>
                <p>
                  {classData.academicYear.tahunMulai}/{classData.academicYear.tahunSelesai} ({classData.academicYear.semester})
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Wali Kelas</h4>
                <p>{classData.homeroomTeacher.namaLengkap}</p>
              </div>
            </CardContent>
          </Card>

          {/* Card Mata Pelajaran */}
          <Card>
            <CardHeader>
              <CardTitle>Mata Pelajaran yang Ditempuh</CardTitle>
            </CardHeader>
            <CardContent>
              {classData.subjects.length === 0 ? (
                <p className="text-center text-gray-500">
                  Belum ada mata pelajaran
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {classData.subjects.map((subject) => (
                    <div key={subject.id}>
                      <h4 className="font-medium">{subject.namaMapel}</h4>
                      <p className="text-sm text-gray-600">
                        {subject.kodeMapel || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Daftar Siswa */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Siswa Aktif</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>NISN</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classData.students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Tidak ada siswa aktif di kelas ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    classData.students.map((student, idx) => (
                      <TableRow key={student.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{student.namaLengkap}</TableCell>
                        <TableCell>{student.nisn}</TableCell>
                        <TableCell>{student.jenisKelamin ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(student.status)}>
                            {student.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
