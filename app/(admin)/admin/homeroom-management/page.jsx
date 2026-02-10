"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { User, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // pastikan komponen ini tersedia

export default function HomeroomManagementPage() {
  const [classes, setClasses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetClass, setTargetClass] = useState(null);
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClassesAndTutors = async () => {
    try {
      setIsLoading(true);
      const [classRes, tutorRes] = await Promise.all([
        api.get("/classes"),
        api.get("/tutors"),
      ]);
      setClasses(classRes.data.data.classes || []); // ✅ Perbaiki disini
      setTutors(tutorRes.data.data.tutors || []); // ✅ Ambil tutors array
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data kelas atau tutor");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndTutors();
  }, []);

  const handleOpenDialog = (kelas) => {
    setTargetClass(kelas);
    setSelectedTutorId(kelas.homeroomTeacher?.id || "");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTargetClass(null);
    setSelectedTutorId("");
  };

  const handleSaveHomeroom = async () => {
    if (!targetClass || !selectedTutorId) return;

    try {
      setIsSubmitting(true);
      await api.patch(`/classes/${targetClass.id}/homeroom`, {
        homeroomTeacherId: selectedTutorId,
      });
      toast.success("Berhasil menetapkan wali kelas");
      fetchClassesAndTutors();
      handleCloseDialog();
    } catch (error) {
      console.error(error);
      const errorMessage =
        error?.response?.data?.message || "Gagal menetapkan wali kelas";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveHomeroom = async (classId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus wali kelas ini?")) return;
    try {
      await api.patch(`/classes/${classId}/homeroom`, {
        homeroomTeacherId: null,
      });
      toast.success("Wali kelas berhasil dihapus");
      fetchClassesAndTutors();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus wali kelas");
    }
  };

  const groupedByAcademicYear = useMemo(() => {
    const grouped = {};

    classes.forEach((kelas) => {
      const yearAndSemester =
        kelas.academicYear &&
        `${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai} - ${kelas.academicYear.semester}`;

      if (!yearAndSemester) return;

      if (!grouped[yearAndSemester]) {
        grouped[yearAndSemester] = [];
      }
      grouped[yearAndSemester].push(kelas);
    });

    return grouped;
  }, [classes]);

  const sortedAcademicYears = useMemo(() => {
    return Object.keys(groupedByAcademicYear).sort((a, b) => {
      // Sort ascending: oldest year first
      return a.localeCompare(b);
    });
  }, [groupedByAcademicYear]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Kelas",
      cell: (row) => <div className="font-medium">{row.namaKelas}</div>,
    },
    {
      header: "Program",
      cell: (row) => (
        <div className="text-sm">{row.program?.namaPaket || "-"}</div>
      ),
    },
    {
      header: "Tahun Ajaran",
      cell: (row) => (
        <div className="text-sm">
          {row.academicYear
            ? `${row.academicYear.tahunMulai}/${row.academicYear.tahunSelesai} - ${row.academicYear.semester}`
            : "-"}
        </div>
      ),
    },
    {
      header: "Wali Kelas",
      cell: (row) => (
        <div className="text-sm">
          {row.homeroomTeacher?.namaLengkap || (
            <span className="text-muted-foreground italic">
              Belum ditetapkan
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDialog(row)}
          >
            {row.homeroomTeacher ? "Ganti" : "Pilih Wali Kelas"}
          </Button>
          {row.homeroomTeacher && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemoveHomeroom(row.id)}
            >
              Hapus
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filteredClasses = useMemo(() => classes, [classes]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Manajemen Wali Kelas"
        description="Tetapkan Tutor sebagai Wali Kelas untuk setiap kelas."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Manajemen Wali Kelas" },
        ]}
      />

      {sortedAcademicYears.length > 0 ? (
        <Accordion type="multiple" className="space-y-4">
          {sortedAcademicYears.map((tahun) => (
            <AccordionItem key={tahun} value={tahun}>
              <AccordionTrigger className="text-base font-semibold">
                Tahun Ajaran {tahun}
              </AccordionTrigger>
              <AccordionContent>
                <DataTable
                  data={groupedByAcademicYear[tahun]}
                  columns={columns}
                  isLoading={isLoading}
                  loadingMessage={`Memuat kelas untuk tahun ajaran ${tahun}...`}
                  emptyMessage="Tidak ada kelas di tahun ini."
                  keyExtractor={(item) => item.id}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <EmptyState
          title="Belum ada data kelas"
          description="Silakan tambahkan kelas terlebih dahulu sebelum menetapkan wali kelas."
          icon={<GraduationCap className="h-8 w-8 text-muted-foreground" />}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Pilih Wali Kelas untuk {targetClass?.namaKelas}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Wali Kelas <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedTutorId}
                onValueChange={setSelectedTutorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tutor..." />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.namaLengkap}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedTutorId && (
                <p className="text-[0.8rem] text-muted-foreground">
                  Wajib memilih salah satu tutor.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveHomeroom}
                disabled={!selectedTutorId || isSubmitting}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
