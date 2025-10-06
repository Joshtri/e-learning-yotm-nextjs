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
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function BehaviorScoresPage() {
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
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
      const res = await api.get("/homeroom/my-homeroom-classes", {
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

  const handleOpenConfirmDialog = (kelas) => {
    setSelectedClass(kelas);
    setShowConfirmDialog(true);
  };

  const handleBeriNilaiSikap = () => {
    if (!selectedClass) return;

    setIsNavigating(true);
    router.push(`/homeroom/behavior-scores/${selectedClass.id}/input`);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Nilai Sikap & Kehadiran"
        description="Berikan nilai sikap untuk siswa di kelas yang Anda wali."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Nilai Sikap & Kehadiran" },
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
                {year.tahunMulai}/{year.tahunSelesai} - Semester {year.semester}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas</CardTitle>
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
                  <TableHead>Semester</TableHead>
                  <TableHead>Jumlah Siswa</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Tidak ada kelas yang Anda wali
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((kelas, index) => (
                    <TableRow key={kelas.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{kelas.namaKelas}</TableCell>
                      <TableCell>{kelas.program.namaPaket}</TableCell>
                      <TableCell>
                        {kelas.academicYear.tahunMulai}/{kelas.academicYear.tahunSelesai}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          kelas.academicYear.semester === 'GENAP'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {kelas.academicYear.semester}
                        </span>
                      </TableCell>
                      <TableCell>{kelas._count?.students || 0} siswa</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleOpenConfirmDialog(kelas)}
                          disabled={isNavigating}
                        >
                          {isNavigating && selectedClass?.id === kelas.id
                            ? "Memuat..."
                            : "Beri Nilai Sikap"}
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleBeriNilaiSikap}
        title="Konfirmasi Beri Nilai Sikap"
        description={
          selectedClass
            ? `Anda akan memberikan nilai sikap untuk ${selectedClass._count?.students || 0} siswa di kelas ${selectedClass.namaKelas} (${selectedClass.program?.namaPaket}). Lanjutkan?`
            : ""
        }
        confirmText="Ya, Lanjutkan"
        cancelText="Batal"
        isLoading={isNavigating}
      />
    </div>
  );
}
