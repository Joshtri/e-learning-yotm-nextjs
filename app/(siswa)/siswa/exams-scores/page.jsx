"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function ExamScoresPage() {
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScores = async () => {
    try {
      const res = await api.get("/student/exams-scores");
      setScores(res.data.data); // ✅ langsung array
    } catch (err) {
      console.error("Gagal memuat nilai ujian:", err);
      toast.error("Gagal memuat nilai ujian");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const groupScores = {
    DAILY_TEST: [],
    START_SEMESTER_TEST: [],
    MIDTERM: [],
    FINAL_EXAM: [],
  };

  scores.forEach((item) => {
    if (groupScores[item.jenis]) {
      groupScores[item.jenis].push(item);
    }
  });

  const renderScoreList = (items, title) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground">Belum ada nilai tersedia.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between border p-4 rounded-lg"
            >
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.subject?.namaMapel || "-"}
                </p>
              </div>

              <div className="flex flex-col text-right">
                <div>
                  <span className="font-semibold">
                    {item.nilai}/{item.nilaiMaksimal}
                  </span>
                </div>
                <Badge
                  variant={
                    item.statusKelulusan === "LULUS" ? "success" : "destructive"
                  }
                  className="mt-2 self-end"
                >
                  {item.statusKelulusan}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6 space-y-6">
          <PageHeader
            title="Rekapitulasi Nilai Ujian"
            description="Lihat hasil ujian Anda dari semua kategori."
            breadcrumbs={[
              { label: "Dashboard", href: "/siswa/dashboard" },
              { label: "Rekap Nilai" },
            ]}
          />

          {isLoading ? (
            <p className="text-center text-muted-foreground">Memuat nilai...</p>
          ) : (
            <div className="space-y-6">
              {renderScoreList(groupScores.DAILY_TEST, "Nilai Ujian Harian")}
              {renderScoreList(
                groupScores.START_SEMESTER_TEST,
                "Nilai Ujian Awal Semester"
              )}
              {renderScoreList(
                groupScores.MIDTERM,
                "Nilai Ujian Tengah Semester (UTS)"
              )}
              {renderScoreList(
                groupScores.FINAL_EXAM,
                "Nilai Ujian Akhir Semester (UAS)"
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
