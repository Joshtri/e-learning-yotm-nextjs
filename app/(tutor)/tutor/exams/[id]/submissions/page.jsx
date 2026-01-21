"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ExamSubmissionsPage() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/tutor/exams/${id}/submissions`);
      setData(res.data.data || []);
    } catch (error) {
      console.error("Gagal ambil hasil ujian:", error);
      toast.error("Gagal memuat hasil ujian");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Siswa",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.student?.namaLengkap || "-"}</div>
          <div className="text-sm text-muted-foreground">
            NISN: {row.student?.nisn || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => {
        const isGraded = row.status === "GRADED" || row.waktuDinilai;
        return (
          <Badge variant={isGraded ? "default" : "secondary"}>
            {isGraded ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> Sudah Dinilai</>
            ) : (
              <><Clock className="h-3 w-3 mr-1" /> Belum Dinilai</>
            )}
          </Badge>
        );
      },
    },
    {
      header: "Nilai",
      cell: (row) => (
        <span className={`font-semibold ${row.nilai !== null ? "text-green-600" : "text-muted-foreground"}`}>
          {row.nilai ?? "-"}
        </span>
      ),
    },
    {
      header: "Waktu Kumpul",
      cell: (row) =>
        row.waktuKumpul
          ? new Date(row.waktuKumpul).toLocaleString("id-ID")
          : "-",
    },
    {
      header: "Aksi",
      cell: (row) => (
        <Button size="sm" asChild>
          <Link href={`/tutor/exams/${id}/submissions/${row.id}`}>
            <Eye className="h-4 w-4 mr-1" />
            Periksa Jawaban
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Hasil Ujian"
            description="Daftar siswa yang telah mengerjakan ujian ini."
            backButton={true}
            backButtonLink={`/tutor/exams/${id}`}
            backButtonLabel="Kembali ke Ujian"
            breadcrumbs={[
              { label: "Ujian", href: "/tutor/exams" },
              { label: "Hasil Ujian", href: `/tutor/exams/${id}` },
            ]}
          />

          <Tabs defaultValue="all" className="space-y-6">
            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={data}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat hasil ujian..."
                emptyMessage="Belum ada siswa yang mengerjakan"
                keyExtractor={(item) => item.id}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
