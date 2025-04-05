"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";

export default function ClassDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        const res = await api.get(`/tutor/my-classes/class-detail?id=${id}`);
        setData(res.data.data);
      } catch {
        toast.error("Gagal memuat detail kelas");
      }
    };

    fetchClassDetail();
  }, [id]);

  if (!data) return <div className="p-6">Memuat...</div>;

  return (
    <div className="p-6">
      <PageHeader
        title={`Detail Kelas: ${data.class.namaKelas}`}
        description={`${data.class.program.namaPaket} - ${data.class.academicYear.tahunMulai}/${data.class.academicYear.tahunSelesai}`}
        breadcrumbs={[
          { label: "Kelas", href: "/tutor/my-classes" },
          { label: data.class.namaKelas, href: `/tutor/my-classes/${id}` },
          { label: "Detail" },
        ]}
      />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="nilai-uts">Nilai UTS</TabsTrigger>
          <TabsTrigger value="nilai-uas">Nilai UAS</TabsTrigger>
          <TabsTrigger value="nilai-kuis">Nilai Kuis</TabsTrigger>
          <TabsTrigger value="tugas">Tugas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Umum</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>Mata Pelajaran:</strong> {data.subject.namaMapel}
                </li>
                <li>
                  <strong>Tutor:</strong> {data.tutor.namaLengkap}
                </li>
                <li>
                  <strong>Jumlah Siswa:</strong> {data.students.length}
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tabs lainnya pakai DataTable nilai */}
        <TabsContent value="nilai-uts" className="pt-4">
          <DataTable
            data={data.nilaiUTS}
            columns={[
              { header: "Nama", cell: (row) => row.nama },
              { header: "Nilai", cell: (row) => row.nilai ?? "-" },
            ]}
            keyExtractor={(row) => row.id}
          />
        </TabsContent>

        <TabsContent value="nilai-uas" className="pt-4">
          <DataTable
            data={data.nilaiUAS}
            columns={[
              { header: "Nama", cell: (row) => row.nama },
              { header: "Nilai", cell: (row) => row.nilai ?? "-" },
            ]}
            keyExtractor={(row) => row.id}
          />
        </TabsContent>

        <TabsContent value="nilai-kuis" className="pt-4">
          <DataTable
            data={data.nilaiKuis}
            columns={[
              { header: "Nama", cell: (row) => row.nama },
              { header: "Rata-rata", cell: (row) => row.nilaiRata ?? "-" },
            ]}
            keyExtractor={(row) => row.id}
          />
        </TabsContent>

        <TabsContent value="tugas" className="pt-4">
          <DataTable
            data={data.nilaiTugas}
            columns={[
              { header: "Nama", cell: (row) => row.nama },
              { header: "Nilai Akhir", cell: (row) => row.nilai ?? "-" },
            ]}
            keyExtractor={(row) => row.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
