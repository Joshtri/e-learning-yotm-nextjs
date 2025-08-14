"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ClassDetailPage() {
  const { id } = useParams();
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const fetchClassDetail = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/classes/${id}`);
      setClassData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat detail kelas");
    } finally {
      setIsLoading(false);
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
    // enum uppercase (MALE/FEMALE) juga ter-handle oleh toLowerCase di atas
    return "-";
  };

  useEffect(() => {
    if (id) fetchClassDetail();
  }, [id]);

  const studentColumns = [
    { header: "No", cell: (_, i) => i + 1, className: "w-[50px]" },
    { header: "Nama Lengkap", cell: (row) => row.namaLengkap },
    { header: "NISN", cell: (row) => row.nisn },
    {
      header: "Jenis Kelamin",
      cell: (row) =>
        mapGender(
          row.jenisKelamin ??
            row.gender ??
            row.user?.jenisKelamin ??
            row.user?.gender
        ),
    },
    { header: "Email", cell: (row) => row.user?.email || "-" },
  ];

  return (
    <main className="p-6 space-y-6">
      <PageHeader
        title={classData?.namaKelas || "Detail Kelas"}
        description="Informasi lengkap mengenai kelas dan daftar siswa"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Kelas", href: "/admin/classes" },
          { label: classData?.namaKelas || "..." },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Informasi Kelas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <b>Nama Kelas:</b> {classData?.namaKelas}
          </p>
          <p>
            <b>Program:</b> {classData?.program?.namaPaket || "-"}
          </p>
          <p>
            <b>Tahun Ajaran:</b> {classData?.academicYear?.tahunMulai}/
            {classData?.academicYear?.tahunSelesai}
          </p>
          <p>
            <b>Jumlah Siswa:</b> {classData?.students?.length || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={classData?.students || []}
            columns={studentColumns}
            isLoading={isLoading}
            loadingMessage="Memuat data siswa..."
            emptyMessage="Belum ada siswa di kelas ini"
            keyExtractor={(s) => s.id}
          />
        </CardContent>
      </Card>
    </main>
  );
}
