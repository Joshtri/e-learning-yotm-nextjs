"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Users, GraduationCap, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataExport } from "@/components/ui/data-export";
import AcademicYearAddModal from "@/components/academic-years/AcademicYearAddModal";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function AcademicYearPage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [selectedYearForActivation, setSelectedYearForActivation] = useState(null);
  const [classesData, setClassesData] = useState(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // State for view classes dialog
  const [showViewClassesDialog, setShowViewClassesDialog] = useState(false);
  const [selectedYearForView, setSelectedYearForView] = useState(null);
  const [viewClassesData, setViewClassesData] = useState(null);
  const [isLoadingViewClasses, setIsLoadingViewClasses] = useState(false);

  const router = useRouter();

  const fetchAcademicYears = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`/academic-years?${params.toString()}`);
      setAcademicYears(response.data.data.academicYears);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Gagal memuat data tahun ajaran:", error);
      toast.error("Gagal memuat data tahun ajaran");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, [pagination.page, pagination.limit, searchQuery]);

  const fetchClassesByAcademicYear = async (academicYearId) => {
    try {
      setIsLoadingClasses(true);
      const response = await api.get(`/academic-years/${academicYearId}/classes`);
      setClassesData(response.data.data);
    } catch (error) {
      console.error("Gagal memuat data kelas:", error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleOpenActivateDialog = async (item) => {
    setSelectedYearForActivation(item);
    setShowActivateDialog(true);
    await fetchClassesByAcademicYear(item.id);
  };

  const handleActivateAcademicYear = async () => {
    if (!selectedYearForActivation) return;

    try {
      setIsActivating(true);
      await api.patch(`/academic-years/${selectedYearForActivation.id}/activate`);
      toast.success("Tahun ajaran berhasil diaktifkan");
      setShowActivateDialog(false);
      setSelectedYearForActivation(null);
      setClassesData(null);
      fetchAcademicYears();
    } catch (error) {
      console.error("Gagal aktifkan tahun ajaran:", error);
      toast.error(error.response?.data?.message || "Gagal mengaktifkan tahun ajaran");
    } finally {
      setIsActivating(false);
    }
  };

  const handleViewClasses = async (item) => {
    setSelectedYearForView(item);
    setShowViewClassesDialog(true);

    try {
      setIsLoadingViewClasses(true);
      const response = await api.get(`/academic-years/${item.id}/classes`);
      setViewClassesData(response.data.data);
    } catch (error) {
      console.error("Gagal memuat data kelas:", error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setIsLoadingViewClasses(false);
    }
  };

  const filteredAcademicYears = useMemo(() => {
    if (!searchQuery) return academicYears;
    return academicYears.filter((item) =>
      `${item.tahunMulai}/${item.tahunSelesai}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [academicYears, searchQuery]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => (pagination.page - 1) * pagination.limit + index + 1,
      className: "w-[50px]",
    },
    {
      header: "Tahun Ajaran",
      cell: (item) => `${item.tahunMulai}/${item.tahunSelesai}`,
    },
    {
      header: "Semester",
      cell: (item) => (
        <span
          className={`px-2 py-1 rounded-md text-sm ${
            item.semester === "GENAP"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {item.semester}
        </span>
      ),
    },
    {
      header: "Kelas",
      cell: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewClasses(item)}
          className="flex items-center gap-2 hover:bg-blue-50"
        >
          <Users className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-600">{item._count?.classes || 0}</span>
          <span className="text-sm text-muted-foreground">kelas</span>
        </Button>
      ),
    },
    {
      header: "Status",
      cell: (item) => (
        <div className="flex items-center gap-2">
          {item.isActive ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              ✓ Aktif
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenActivateDialog(item)}
              className="text-blue-600 hover:text-blue-700"
            >
              Aktifkan
            </Button>
          )}
        </div>
      ),
    },
    {
      header: "Aksi",
      cell: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/academic-years/${item.id}/edit`)}
        >
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>
      ),
      className: "w-[120px]",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Tahun Ajaran" },
            ]} // Add breadcrumbs here
            title="Manajemen Tahun Ajaran"
            actions={
              <>
                <DataExport
                  data={academicYears}
                  filename="academic-years.csv"
                  label="Export"
                />
                <Button
                  className="ml-2"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Tahun Ajaran
                </Button>
              </>
            }
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              searchPlaceholder="Cari tahun ajaran..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredAcademicYears}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data tahun ajaran..."
                emptyMessage="Tidak ada tahun ajaran ditemukan"
                keyExtractor={(item) => item.id}
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
          <AcademicYearAddModal
            open={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={fetchAcademicYears}
          />

          {/* Activate Academic Year Dialog */}
          <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Konfirmasi Aktivasi Tahun Akademik
                </DialogTitle>
                <DialogDescription>
                  {selectedYearForActivation && (
                    <span className="font-semibold text-gray-900">
                      {selectedYearForActivation.tahunMulai}/{selectedYearForActivation.tahunSelesai} - Semester {selectedYearForActivation.semester}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Warning Alert */}
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-900 font-semibold">
                    Perhatian
                  </AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Mengaktifkan tahun akademik ini akan menonaktifkan tahun akademik yang sedang aktif saat ini.
                    Pastikan semua wali kelas sudah memindahkan siswa mereka ke tahun akademik ini.
                  </AlertDescription>
                </Alert>

                {/* Loading State */}
                {isLoadingClasses ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : classesData ? (
                  <>
                    {/* Summary Card */}
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                          Ringkasan Kelas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Kelas</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {classesData.totalClasses}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Siswa</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {classesData.totalStudents}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Classes List */}
                    {classesData.totalClasses === 0 ? (
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <AlertTitle className="text-red-900 font-semibold">
                          Belum Ada Kelas
                        </AlertTitle>
                        <AlertDescription className="text-red-700">
                          Belum ada kelas yang dipindahkan ke tahun akademik ini.
                          Pastikan wali kelas sudah memindahkan siswa mereka sebelum mengaktifkan tahun akademik ini.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Daftar Kelas yang Sudah Dipindahkan</CardTitle>
                          <CardDescription>
                            Berikut adalah kelas-kelas yang sudah ada di tahun akademik ini
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {classesData.classes.map((cls, index) => (
                              <div
                                key={cls.id}
                                className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-900">
                                        {index + 1}. {cls.namaKelas}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        ({cls.program})
                                      </span>
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground flex items-center gap-4">
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        Wali Kelas: {cls.homeroomTeacher}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <GraduationCap className="h-3 w-3" />
                                        {cls.studentCount} siswa
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : null}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActivateDialog(false);
                    setSelectedYearForActivation(null);
                    setClassesData(null);
                  }}
                  disabled={isActivating}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleActivateAcademicYear}
                  disabled={isActivating || isLoadingClasses || classesData?.totalClasses === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isActivating ? (
                    <>
                      <span className="mr-2">Mengaktifkan...</span>
                    </>
                  ) : (
                    "Ya, Aktifkan Tahun Akademik"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Classes Dialog */}
          <Dialog open={showViewClassesDialog} onOpenChange={setShowViewClassesDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Detail Kelas - Tahun Akademik
                </DialogTitle>
                <DialogDescription>
                  {selectedYearForView && (
                    <div className="flex items-center gap-4 mt-2">
                      <span className="font-semibold text-gray-900 text-base">
                        {selectedYearForView.tahunMulai}/{selectedYearForView.tahunSelesai}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-md text-sm ${
                          selectedYearForView.semester === "GENAP"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        Semester {selectedYearForView.semester}
                      </span>
                      {selectedYearForView.isActive && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          ✓ Aktif
                        </span>
                      )}
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Loading State */}
                {isLoadingViewClasses ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-60 w-full" />
                  </div>
                ) : viewClassesData ? (
                  <>
                    {/* Summary Card */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-blue-700">
                            Total Kelas
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500 rounded-lg">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-3xl font-bold text-blue-900">
                                {viewClassesData.totalClasses}
                              </p>
                              <p className="text-sm text-blue-600">Kelas</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-green-700">
                            Total Siswa
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-500 rounded-lg">
                              <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-3xl font-bold text-green-900">
                                {viewClassesData.totalStudents}
                              </p>
                              <p className="text-sm text-green-600">Siswa</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Classes List */}
                    {viewClassesData.totalClasses === 0 ? (
                      <Alert className="border-gray-200 bg-gray-50">
                        <AlertCircle className="h-5 w-5 text-gray-600" />
                        <AlertTitle className="text-gray-900 font-semibold">
                          Belum Ada Kelas
                        </AlertTitle>
                        <AlertDescription className="text-gray-700">
                          Belum ada kelas yang terdaftar di tahun akademik ini.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Card>
                        <CardHeader className="border-b">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">Daftar Kelas</CardTitle>
                              <CardDescription>
                                {viewClassesData.totalClasses} kelas terdaftar dengan total {viewClassesData.totalStudents} siswa aktif
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="max-h-[400px] overflow-y-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr className="border-b">
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    No
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kelas
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Program
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Wali Kelas
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Siswa
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {viewClassesData.classes.map((cls, index) => (
                                  <tr
                                    key={cls.id}
                                    className="hover:bg-gray-50 transition-colors"
                                  >
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {index + 1}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                          <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-semibold text-gray-900">
                                            {cls.namaKelas}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {cls.program}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="text-sm text-gray-900">
                                        {cls.homeroomTeacher}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center gap-1">
                                        <GraduationCap className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900">
                                          {cls.studentCount}
                                        </span>
                                        <span className="text-sm text-gray-500">siswa</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : null}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewClassesDialog(false);
                    setSelectedYearForView(null);
                    setViewClassesData(null);
                  }}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
