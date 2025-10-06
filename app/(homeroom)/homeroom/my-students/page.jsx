"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import SkeletonTable from "@/components/ui/skeleton/SkeletonTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AcademicYearFilter } from "@/components/AcademicYearFilter";
// import AcademicYearFilter from "@/components/AcademicYearFilter";

export default function MyStudentsPage() {
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({ academicYears: [] });
  const [selectedYear, setSelectedYear] = useState("");

  const fetchStudents = useCallback(async (academicYearId) => {
    try {
      setIsLoading(true);
      const params = academicYearId ? { academicYearId } : {};
      const res = await api.get("/homeroom/my-students", { params });
      setStudents(res.data.data || []);
      setClassInfo(res.data.classInfo || null);
      if (res.data.filterOptions) {
        setFilterOptions(res.data.filterOptions);
      }
      if (res.data.classInfo?.academicYear?.id && !academicYearId) {
        setSelectedYear(res.data.classInfo.academicYear.id);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Gagal memuat data siswa";
      toast.error(errorMessage);
      setStudents([]);
      setClassInfo(null);
      if (error.response?.data?.filterOptions) {
        setFilterOptions(error.response.data.filterOptions);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleYearChange = (yearId) => {
    setSelectedYear(yearId);
    fetchStudents(yearId);
  };

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Lengkap",
      cell: (row) => row.namaLengkap,
    },
    {
      header: "NISN",
      cell: (row) => row.nisn || "-",
    },
    {
      header: "Jenis Kelamin",
      cell: (row) => (row.jenisKelamin === "MALE" ? "Laki-laki" : "Perempuan"),
    },
    {
      header: "Tanggal Lahir",
      cell: (row) =>
        row.tanggalLahir
          ? new Date(row.tanggalLahir).toLocaleDateString("id-ID")
          : "-",
    },
    {
      header: "Status",
      cell: (row) => {
        return (
          <span className={`px-2 py-1 rounded-md text-xs ${
            row.status === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            {row.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Siswa Saya"
        description="Daftar siswa yang berada di kelas Anda sebagai wali kelas."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Siswa Saya" },
        ]}
      >
        <AcademicYearFilter
          academicYears={filterOptions.academicYears}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />
      </PageHeader>

      {/* Info Kelas & Tahun Ajaran */}
      {isLoading && !classInfo ? (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
                <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
      ) : classInfo && (
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
        <SkeletonTable numCols={6} numRows={10} showHeader />
      ) : students.length > 0 ? (
        <DataTable
          data={students}
          columns={columns}
          isLoading={isLoading}
          loadingMessage="Memuat siswa..."
          emptyMessage="Tidak ada siswa di kelas Anda untuk tahun ajaran yang dipilih."
          keyExtractor={(item) => item.id}
        />
      ) : (
        <EmptyState
          title="Tidak Ada Siswa"
          description="Tidak ada data siswa untuk ditampilkan di kelas dan tahun ajaran yang dipilih."
          icon={<GraduationCap className="h-12 w-12 text-muted-foreground" />}
        />
      )}
    </div>
  );
}