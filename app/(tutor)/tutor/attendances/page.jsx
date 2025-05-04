// Halaman daftar kelas untuk melihat presensi per kelas
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AttendanceClassListPage() {
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      fetchClasses(selectedYearId);
    }
  }, [selectedYearId]);

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years");
      const list = res.data?.data?.academicYears || [];
      setAcademicYears(list);

      const active = list.find((y) => y.isActive);
      if (active) setSelectedYearId(active.id);
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
      toast.error("Gagal memuat kelas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Presensi per Kelas"
        description="Lihat dan kelola sesi presensi berdasarkan kelas."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Presensi", href: "/tutor/attendances" },
          { label: "Per Kelas" },
        ]}
      />

      <div className="flex justify-end">
        <Select value={selectedYearId} onValueChange={setSelectedYearId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.tahunMulai}/{year.tahunSelesai}{" "}
                {year.isActive ? "(Aktif)" : ""}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Mapel</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading...</TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Tidak ada kelas
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.class.namaKelas}</TableCell>
                    <TableCell>{item.subject.namaMapel}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() =>
                          router.push(
                            `/tutor/attendances/class/${item.class.id}`
                          )
                        }
                      >
                        Lihat Presensi
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
