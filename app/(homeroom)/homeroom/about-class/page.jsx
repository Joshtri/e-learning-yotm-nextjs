"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import api from "@/lib/axios";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AboutClassPage() {
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClassData();
  }, []);

  const fetchClassData = async () => {
    try {
      const res = await api.get("/homeroom/about-class");
      setClassData(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !classData) {
    return (
      <div className="p-6">
        <PageHeader title="Tentang Kelas" description="Memuat data kelas..." />
        <div className="space-y-4 mt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const {
    namaKelas,
    program,
    academicYear,
    homeroomTeacher,
    students,
    subjects,
  } = classData;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tentang Kelas"
        description="Semua informasi penting tentang kelas ini."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Tentang Kelas" },
        ]}
      />

      {/* Card Info Umum */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Umum Kelas</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold">Nama Kelas</h4>
            <p>{namaKelas}</p>
          </div>
          <div>
            <h4 className="font-semibold">Program</h4>
            <p>{program.namaPaket}</p>
          </div>
          <div>
            <h4 className="font-semibold">Tahun Ajaran</h4>
            <p>
              {academicYear.tahunMulai}/{academicYear.tahunSelesai}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Wali Kelas</h4>
            <p>{homeroomTeacher.namaLengkap}</p>
          </div>
        </CardContent>
      </Card>

      {/* Card Mata Pelajaran */}
      <Card>
        <CardHeader>
          <CardTitle>Mata Pelajaran yang Ditempuh</CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-center text-gray-500">
              Belum ada mata pelajaran
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {subjects.map((subject) => (
                <div key={subject.id}>
                  <h4 className="font-medium">{subject.namaMapel}</h4>
                  <p className="text-sm text-gray-600">
                    {subject.kodeMapel || "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card Daftar Siswa */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>NISN</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Tidak ada siswa.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, idx) => (
                  <TableRow key={student.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{student.namaLengkap}</TableCell>
                    <TableCell>{student.nisn}</TableCell>
                    <TableCell>{student.jenisKelamin ?? "-"}</TableCell>
                    <TableCell>{student.status}</TableCell>
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
