"use client";

import { useEffect, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataTable } from "@/components/ui/data-table";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { DataExport } from "@/components/ui/data-export";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AcademicYearFilter } from "@/components/AcademicYearFilter";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [classOptions, setClassOptions] = useState([]);
  const [isSelectingClass, setIsSelectingClass] = useState(false);

  const router = useRouter();

  // Fetch Academic Years
  // Fetch Academic Years
  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years");
      const years = res.data.data.academicYears || [];

      setAcademicYears(years);

      // 👉 Set default ke yang aktif
      const activeYear = years.find((y) => y.isActive);
      if (activeYear) {
        setSelectedAcademicYear(activeYear.id);
      } else if (years.length > 0) {
        setSelectedAcademicYear(years[0].id); // fallback ke pertama
      }
    } catch (err) {
      toast.error("Gagal memuat tahun ajaran");
    }
  };

  // Set default selected year
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear) {
      setSelectedAcademicYear(academicYears[0].id);
    }
  }, [academicYears]);

  // Fetch Students
  const fetchStudents = async () => {
    if (!selectedAcademicYear) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      params.append("academicYearId", selectedAcademicYear);
      if (searchQuery) params.append("search", searchQuery);

      const res = await api.get(`/students?${params.toString()}`);
      setStudents(res.data.data.students);
      setPagination(res.data.data.pagination);
    } catch (error) {
      toast.error("Gagal memuat data siswa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [pagination.page, pagination.limit, searchQuery, selectedAcademicYear]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter((student) =>
      [student.user?.nama, student.nisn, student.user?.email].some((val) =>
        val?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [students, searchQuery]);

  const handleAddClass = async (studentId) => {
    setSelectedStudentId(studentId);
    setIsSelectingClass(true);
    try {
      const res = await api.get("/classes");
      setClassOptions(res.data.data.classes || []);
    } catch {
      toast.error("Gagal memuat daftar kelas");
    }
  };

  const handleSelectClass = async (classId) => {
    try {
      await api.patch(`/students/${selectedStudentId}/class`, { classId });
      toast.success("Kelas berhasil ditambahkan ke siswa");
      setIsSelectingClass(false);
      fetchStudents();
    } catch {
      toast.error("Gagal menambahkan kelas ke siswa");
    }
  };

  const columns = [
    {
      header: "No",
      cell: (_, index) => (pagination.page - 1) * pagination.limit + index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama",
      cell: (student) => (
        <div className="flex items-center gap-2">
          {/* <EntityAvatar name={student.user?.nama || "-"} />
          <div className="font-medium">{student.user?.nama || "-"}</div> */}
          <EntityAvatar name={student.namaLengkap || "-"} />
          <div className="font-medium">{student.namaLengkap|| "-"}</div>
        </div>
      ),
    },
    { header: "Email", cell: (student) => student.user?.email || "-" },
    { header: "NISN", accessorKey: "nisn" },
    { header: "Jenis Kelamin", accessorKey: "jenisKelamin" },
    {
      header: "Kelas",
      cell: (student) =>
        student.class?.namaKelas || (
          <span className="text-muted-foreground">Belum terdaftar</span>
        ),
    },
    {
      header: "Paket",
      cell: (student) => student.class?.program?.namaPaket || "-",
    },
    {
      header: "Tanggal Lahir",
      cell: (student) =>
        student.tanggalLahir
          ? new Date(student.tanggalLahir).toLocaleDateString("id-ID")
          : "-",
    },
    { header: "Alamat", accessorKey: "alamat" },
    {
      header: "Aksi",
      cell: (student) => (
        <div className="flex justify-end">
          {student.class?.id ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push(`/admin/students/${student.id}/edit`)}
            >
              Edit
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddClass(student.id)}
            >
              Tambah Kelas
            </Button>
          )}
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Manajemen Siswa"
            actions={
              <>
                <DataExport
                  data={students}
                  filename="students.csv"
                  label="Export"
                />
                <Button
                  className="ml-2"
                  onClick={() => router.push("/admin/students/create")}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tambah Siswa
                </Button>
              </>
            }
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Siswa" },
            ]}
            
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              searchPlaceholder="Cari siswa..."
              filterOptions={[
                {
                  label: "Tahun Ajaran",
                  content: (
                    <AcademicYearFilter
                      academicYears={academicYears}
                      selectedId={selectedAcademicYear}
                      onChange={(val) => {
                        setSelectedAcademicYear(val);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                    />
                  ),
                },
              ]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredStudents}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data siswa..."
                emptyMessage="Tidak ada data siswa ditemukan"
                keyExtractor={(student) => student.id}
                pagination={{
                  currentPage: pagination.page,
                  totalPages: pagination.pages,
                  onPageChange: (newPage) =>
                    setPagination((prev) => ({ ...prev, page: newPage })),
                  totalItems: pagination.total,
                  itemsPerPage: pagination.limit,
                }}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Modal Tambah Kelas */}
      {isSelectingClass && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 space-y-4 w-full max-w-md">
            <h2 className="text-lg font-semibold">Pilih Kelas</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {classOptions.length > 0 ? (
                classOptions.map((kelas) => (
                  <Button
                    key={kelas.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSelectClass(kelas.id)}
                  >
                    {kelas.namaKelas}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tidak ada kelas tersedia.
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setIsSelectingClass(false)}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
