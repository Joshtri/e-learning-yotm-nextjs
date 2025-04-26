"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";

export default function AssignmentPreviewPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await api.get(`/student/assignments/${id}/preview`);
        setData(res.data.data);
      } catch (error) {
        toast.error("Gagal memuat preview jawaban");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
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
      <div className="p-6 text-muted-foreground">Data tidak ditemukan.</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Preview Jawaban Tugas"
        description={`Judul: ${data.judul}`}
        breadcrumbs={[
          { label: "Tugas", href: "/siswa/assignments/list" },
          { label: "Preview" },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>{data.judul}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mapel: {data.subject} | Kelas: {data.class} | Tutor: {data.tutor}
          </p>
          <p className="text-sm">
            Nilai:{" "}
            <Badge variant="success">{data.nilai ?? "Belum Dinilai"}</Badge>
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
              <div className="text-muted-foreground">
                <p>
                  <strong>Jawaban Anda:</strong> {q.jawaban}
                </p>
                {q.adalahBenar != null && (
                  <Badge variant={q.adalahBenar ? "success" : "destructive"}>
                    {q.adalahBenar ? "Benar" : "Salah"}
                  </Badge>
                )}
                {q.feedback && (
                  <p className="mt-1 text-xs italic">Feedback: {q.feedback}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
