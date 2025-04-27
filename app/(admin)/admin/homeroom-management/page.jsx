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

export default function HomeroomManagementPage() {
  const [classes, setClasses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleAssignHomeroom = async (classId, tutorId) => {
    try {
      await api.patch(`/classes/${classId}/homeroom`, {
        homeroomTeacherId: tutorId,
      });
      toast.success("Berhasil menetapkan wali kelas");
      fetchClassesAndTutors(); // Refresh
    } catch (error) {
      console.error(error);
      toast.error("Gagal menetapkan wali kelas");
    }
  };

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
            ? `${row.academicYear.tahunMulai}/${row.academicYear.tahunSelesai}`
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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {row.homeroomTeacher ? "Ganti Wali Kelas" : "Pilih Wali Kelas"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pilih Wali Kelas untuk {row.namaKelas}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select
                onValueChange={(tutorId) =>
                  handleAssignHomeroom(row.id, tutorId)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.namaLengkap}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
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

      {filteredClasses.length > 0 ? (
        <DataTable
          data={filteredClasses}
          columns={columns}
          isLoading={isLoading}
          loadingMessage="Memuat daftar kelas..."
          emptyMessage="Belum ada kelas."
          keyExtractor={(item) => item.id}
        />
      ) : (
        <EmptyState
          title="Belum ada data kelas"
          description="Silakan tambahkan kelas terlebih dahulu sebelum menetapkan wali kelas."
          icon={<GraduationCap className="h-8 w-8 text-muted-foreground" />}
        />
      )}
    </div>
  );
}
