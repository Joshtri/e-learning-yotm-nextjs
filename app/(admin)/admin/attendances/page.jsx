"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAttendancePage() {
  const [data, setData] = useState({
    attendances: [],
    filterOptions: {
      classes: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    classId: "",
    month: "",
  });

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.classId) params.append("classId", filters.classId);
      if (filters.month) params.append("month", filters.month);

      const res = await axios.get(
        `/api/attendances?${params.toString()}`
      );
      setData(res.data);
    } catch (error) {
      console.error("Gagal mengambil data presensi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [filters]);

  const { attendances, filterOptions } = data;

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Rekap Presensi Siswa</CardTitle>
      </CardHeader>
      <CardContent>
        {/* FILTER */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="w-full md:w-auto">
            <Select
              value={filters.classId}
              onValueChange={(value) =>
                setFilters({ ...filters, classId: value })
              }
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.namaKelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Select
              value={filters.month}
              onValueChange={(value) =>
                setFilters({ ...filters, month: value })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => setFilters({ classId: "", month: "" })}
          >
            Reset Filter
          </Button>
        </div>

        {/* TABEL */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : attendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Tidak ada data presensi.
                  </TableCell>
                </TableRow>
              ) : (
                attendances.map((attendance, index) => (
                  <TableRow key={attendance.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{attendance.student.namaLengkap}</TableCell>
                    <TableCell>{attendance.class.namaKelas}</TableCell>
                    <TableCell>
                      {new Date(attendance.tanggal).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      {attendance.status === "HADIR"
                        ? "Hadir"
                        : attendance.status === "IZIN"
                        ? "Izin"
                        : attendance.status === "SAKIT"
                        ? "Sakit"
                        : "Alpa"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
