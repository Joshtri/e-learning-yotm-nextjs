"use client";

import api from "@/lib/axios";
import { UserPlus, Info, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { DataExport } from "@/components/ui/data-export";
import { DataTable } from "@/components/ui/data-table";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { AcademicYearFilter } from "@/components/AcademicYearFilter";
import PaginationBar from "@/components/ui/PaginationBar";

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

  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);

  const [sortOrder, setSortOrder] = useState("asc"); // "asc" atau "desc"

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [classOptions, setClassOptions] = useState([]);
  const [isSelectingClass, setIsSelectingClass] = useState(false);
  const [selectedCompleteness, setSelectedCompleteness] = useState(null);

  const router = useRouter();

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

  // Fetch Programs
  const fetchPrograms = async () => {
    try {
      const res = await api.get("/programs");
      setPrograms(res.data.data.programs || []);
    } catch (err) {
      console.error("Gagal memuat program:", err);
    }
  };

  const mapGender = (raw) => {
    if (raw == null) return "-";
    const s = String(raw).trim().toLowerCase();

    // laki-laki
    if (
      ["male", "m", "l", "pria", "laki-laki", "laki_laki", "laki"].includes(s)
    ) {
      return "Laki-laki";
    }
    // perempuan
    if (["female", "woman", "f", "p", "wanita", "perempuan"].includes(s)) {
      return "Perempuan";
    }
    return "-";
  };

  // Initial Fetch
  useEffect(() => {
    fetchAcademicYears();
    fetchPrograms();
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
      if (selectedProgram) params.append("programId", selectedProgram);
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedGender) params.append("jenisKelamin", selectedGender);

      const res = await api.get(`/students?${params.toString()}`);
      setStudents(res.data.data.students);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Gagal memuat data siswa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    selectedAcademicYear,
    selectedProgram,
    selectedStatus,
    selectedGender,
  ]);

  // Helper untuk cek kelengkapan
  const checkCompleteness = (student) => {
    const missing = [];
    if (!student.nis) missing.push("NIS");
    if (!student.nisn) missing.push("NISN");
    // Tambah field lain jika perlu

    return {
      isComplete: missing.length === 0,
      missing,
    };
  };

  const filteredStudents = useMemo(() => {
    let result = students;

    // Filter by search
    if (searchQuery) {
      result = result.filter((student) =>
        [student.user?.nama, student.nisn, student.user?.email].some((val) =>
          val?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      );
    }

    // Filter by Completeness (Client-side)
    if (selectedCompleteness) {
      result = result.filter((student) => {
        const { isComplete } = checkCompleteness(student);
        if (selectedCompleteness === "COMPLETE") return isComplete;
        if (selectedCompleteness === "INCOMPLETE") return !isComplete;
        return true;
      });
    }

    // Sort by namaLengkap
    return result.slice().sort((a, b) => {
      const nameA = a.namaLengkap?.toLowerCase() || "";
      const nameB = b.namaLengkap?.toLowerCase() || "";
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB, "id")
        : nameB.localeCompare(nameA, "id");
    });
  }, [students, searchQuery, sortOrder, selectedCompleteness]); // Add selectedCompleteness dependency

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
          <EntityAvatar name={student.namaLengkap || "-"} />
          <div className="flex flex-col">
            <span className="font-medium">{student.namaLengkap || "-"}</span>
            <span className="text-xs text-muted-foreground">
              {student.nis || "NIS Kosong"}
            </span>
          </div>
        </div>
      ),
    },
    { header: "Email", cell: (student) => student.user?.email || "-" },
    { header: "NISN", accessorKey: "nisn", cell: (s) => s.nisn || "-" },
    {
      header: "Jenis Kelamin",
      cell: (student) =>
        mapGender(
          student.jenisKelamin ??
            student.gender ??
            student.user?.jenisKelamin ??
            student.user?.gender,
        ),
    },
    {
      header: "Kelas",
      cell: (student) =>
        student.class?.namaKelas || (
          <span className="text-muted-foreground">Belum terdaftar</span>
        ),
    },
    // {
    //   header: "Paket",
    //   cell: (student) => student.class?.program?.namaPaket || "-",
    // },
    {
      header: "Kelengkapan Data",
      cell: (student) => {
        const { isComplete, missing } = checkCompleteness(student);

        if (isComplete) {
          return (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Lengkap</span>
            </div>
          );
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-amber-600 cursor-help">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-medium decoration-dotted underline underline-offset-2">
                    Belum Lengkap
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold text-xs mb-1">Data Belum Diisi:</p>
                <ul className="list-disc pl-4 text-xs">
                  {missing.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (student) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            student.status === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {student.status || "ACTIVE"}
        </span>
      ),
    },
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

  const toolbarFilters = [
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
    {
      label: "Program",
      options: [
        { label: "Semua Program", value: "ALL" },
        ...(Array.isArray(programs) ? programs : []).map((p) => ({
          label: p.namaPaket,
          value: p.id,
        })),
      ],
      onSelect: (value) => {
        setSelectedProgram(value === "ALL" ? null : value);
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
    {
      label: "Status Data",
      options: [
        { label: "Semua", value: "ALL" },
        { label: "Data Lengkap", value: "COMPLETE" },
        { label: "Belum Lengkap", value: "INCOMPLETE" },
      ],
      onSelect: (value) => {
        setSelectedCompleteness(value === "ALL" ? null : value);
        // Note: Client side filtering only affects current page data
      },
    },
    {
      label: "Status Siswa",
      options: [
        { label: "Semua Status", value: "ALL" },
        { label: "Aktif", value: "ACTIVE" },
        { label: "Lulus", value: "GRADUATED" },
        { label: "Pindah", value: "TRANSFERRED" },
        { label: "Keluar", value: "DROPPED_OUT" },
        { label: "Meninggal", value: "DECEASED" },
      ],
      onSelect: (value) => {
        setSelectedStatus(value === "ALL" ? null : value);
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
    {
      label: "Gender",
      options: [
        { label: "Semua Gender", value: "ALL" },
        { label: "Laki-laki", value: "MALE" },
        { label: "Perempuan", value: "FEMALE" },
      ],
      onSelect: (value) => {
        setSelectedGender(value === "ALL" ? null : value);
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
    {
      label: "Urut Nama",
      content: (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
        >
          {sortOrder === "asc" ? "A-Z" : "Z-A"}
        </Button>
      ),
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
              filterOptions={toolbarFilters}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredStudents}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data siswa..."
                emptyMessage="Tidak ada data siswa ditemukan"
                keyExtractor={(student) => student.id}
              />

              {/* Pagination footer */}
              <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {pagination.total > 0 ? (
                    <>
                      Menampilkan{" "}
                      <span className="font-medium">
                        {Math.min(
                          (pagination.page - 1) * pagination.limit + 1,
                          pagination.total,
                        )}
                      </span>{" "}
                      –{" "}
                      <span className="font-medium">
                        {Math.min(
                          pagination.page * pagination.limit,
                          pagination.total,
                        )}
                      </span>{" "}
                      dari{" "}
                      <span className="font-medium">{pagination.total}</span>{" "}
                      data
                    </>
                  ) : (
                    "Tidak ada data"
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Baris per halaman
                    </span>
                    <select
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                      value={pagination.limit}
                      onChange={(e) =>
                        setPagination((prev) => ({
                          ...prev,
                          limit: Number(e.target.value),
                          page: 1,
                          // reset ke halaman 1
                        }))
                      }
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <PaginationBar
                    page={pagination.page}
                    pages={Math.max(1, pagination.pages ?? 1)}
                    disabled={isLoading}
                    onPageChange={(newPage) =>
                      setPagination((prev) => ({ ...prev, page: newPage }))
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

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
