"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataExport } from "@/components/ui/data-export";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import ClassSubjectTutorAddModal from "@/components/class-subject-tutor/ClassSubjectTutorAddModal";
import { AcademicYearFilter } from "@/components/AcademicYearFilter";
import { useRouter } from "next/navigation";

export default function ClassSubjectTutorPage() {
  const [data, setData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(null);

  // Fetch Academic Years
  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years");
      const years = res.data.data.academicYears || [];

      setAcademicYears(years);

      const activeYear = years.find((y) => y.isActive);
      if (activeYear) {
        setSelectedAcademicYear(activeYear.id);
      } else if (years.length > 0) {
        setSelectedAcademicYear(years[0].id); // fallback
      }
    } catch (err) {
      toast.error("Gagal memuat tahun ajaran");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    try {
      setDeletingId(id);
      await api.delete(`/class-subject-tutors/${id}`);
      toast.success("Data berhasil dihapus");
      await fetchData();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Gagal menghapus data jadwal belajar";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedAcademicYear) {
        params.append("academicYearId", selectedAcademicYear);
      }

      const [res, clsRes, subRes, tutRes] = await Promise.all([
        api.get(`/class-subject-tutors?${params.toString()}`),
        api.get("/classes", { params: { onlyActive: true } }),
        api.get("/subjects"),
        api.get("/tutors"),
      ]);

      setData(res.data.data);
      setClasses(clsRes.data.data.classes || []);
      setSubjects(subRes.data.data.subjects || []);
      setTutors(tutRes.data.data.tutors || []);
    } catch (error) {
      console.error("Gagal memuat data:", error);
      toast.error("Gagal memuat data jadwal belajar");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedAcademicYear) fetchData();
  }, [selectedAcademicYear]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter(
      (item) =>
        item.class.namaKelas
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.subject.namaMapel
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.tutor.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Kelas",
      cell: (row) => row.class?.namaKelas || "-",
    },
    {
      header: "Mata Pelajaran",
      cell: (row) => row.subject?.namaMapel || "-",
    },
    {
      header: "Tutor",
      cell: (row) => row.tutor?.namaLengkap || "-",
    },

    {
      header: "Aksi",
      className: "w-[120px]",
      cell: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              router.push(`/admin/class-subject-tutor/${row.id}/edit`)
            }
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(row.id)}
            disabled={deletingId === row.id}
          >
            {deletingId === row.id ? "Menghapus..." : "Hapus"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Pembagian Jadwal Belajar"
            description="Manajemen kelas, mata pelajaran, dan tutor."
            actions={
              <>
                <DataExport
                  data={data}
                  filename="jadwal-belajar.csv"
                  label="Export"
                />
                <Button className="ml-2" onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Jadwal
                </Button>
              </>
            }
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Pembagian Jadwal Belajar" },
            ]} // Add breadcrumbs here
          />

          {selectedAcademicYear && (
            <div className="mb-4 text-sm text-muted-foreground">
              Tahun Ajaran Aktif:{" "}
              <span className="font-medium text-foreground">
                {
                  academicYears.find((y) => y.id === selectedAcademicYear)
                    ?.tahunMulai
                }
                /
                {
                  academicYears.find((y) => y.id === selectedAcademicYear)
                    ?.tahunSelesai
                }
                {" - "}
                {
                  academicYears.find((y) => y.id === selectedAcademicYear)
                    ?.semester
                }
              </span>
            </div>
          )}

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => setSearchQuery(value)}
              searchPlaceholder="Cari berdasarkan kelas, mapel, atau tutor..."
              filterOptions={[
                {
                  label: "Tahun Ajaran",
                  content: (
                    <AcademicYearFilter
                      academicYears={academicYears}
                      selectedId={selectedAcademicYear}
                      onChange={(val) => setSelectedAcademicYear(val)}
                    />
                  ),
                },
              ]}
            />

            <TabsContent value="all" className="space-y-6">
              {Object.entries(
                filteredData.reduce((acc, item) => {
                  const kelas = item.class?.namaKelas || "Tanpa Kelas";
                  if (!acc[kelas]) acc[kelas] = [];
                  acc[kelas].push(item);
                  return acc;
                }, {})
              ).map(([kelas, items]) => (
                <div key={kelas} className="space-y-2">
                  <h2 className="text-lg font-semibold">{kelas}</h2>
                  <DataTable
                    data={items}
                    columns={columns}
                    isLoading={isLoading}
                    loadingMessage={`Memuat data untuk ${kelas}...`}
                    emptyMessage={`Tidak ada data ditemukan untuk ${kelas}`}
                    keyExtractor={(item) => item.id}
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <ClassSubjectTutorAddModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        classes={classes}
        subjects={subjects}
        tutors={tutors}
      />
    </div>
  );
}
