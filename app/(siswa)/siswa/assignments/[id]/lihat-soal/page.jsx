"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";

export default function LihatSoalPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const fetchSoal = async () => {
      try {
        const res = await api.get(`/student/assignments/${id}/lihat-soal`);
        setData(res.data.data);
      } catch (error) {
        toast.error("Gagal memuat soal tugas");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSoal();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-muted-foreground">Data soal tidak ditemukan.</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Lihat Soal Tugas"
        description={`Judul: ${data.judul}`}
        breadcrumbs={[
          { label: "Tugas", href: "/siswa/assignments/list" },
          { label: "Lihat Soal" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>{data.judul}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mapel: {data.subject} | Kelas: {data.class} | Tutor: {data.tutor}
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {data.questions.map((q, index) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle>Soal {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{q.teks}</p>
              <ul className="list-disc ml-4 space-y-1">
                {q.options.map((opt) => (
                  <li key={opt.id}>
                    <span className="font-semibold">{opt.kode}.</span>{" "}
                    {opt.teks}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
