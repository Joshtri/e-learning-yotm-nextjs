"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import { toast } from "sonner";
import { AcademicYearFilter } from "@/components/AcademicYearFilter"; // Keep this import

export default function ExamScoresPage() {
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]); // New state for academic years
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);

  // Function to fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic-years");
      const fetchedYears = Array.isArray(res.data.data) ? res.data.data : [];
      console.log("Raw Fetched Academic Years:", fetchedYears); // Log raw data

      const formattedYears = fetchedYears.map(year => ({
        id: year.id,
        tahunMulai: new Date(year.startDate).getFullYear(), // Assuming startDate is a date string
        tahunSelesai: new Date(year.endDate).getFullYear(), // Assuming endDate is a date string
        semester: year.name || "Semester", // Assuming 'name' can be used for semester or a placeholder
      }));

      console.log("Formatted Academic Years:", formattedYears); // Log formatted data
      setAcademicYears(formattedYears);
      // Set the latest academic year as default
      if (fetchedYears.length > 0) {
        setSelectedAcademicYearId(fetchedYears[0].id);
      }
    } catch (err) {
      console.error("Gagal memuat tahun ajaran:", err);
      toast.error("Gagal memuat tahun ajaran.");
    }
  };

  // Function to fetch scores, now accepts academicYearId
  const fetchScores = async (academicYearId) => {
    setIsLoading(true);
    try {
      const res = await api.get("/student/exams-scores", {
        params: { academicYearId },
      });
      setScores(res.data.data);
    } catch (err) {
      console.error("Gagal memuat nilai ujian:", err);
      toast.error("Gagal memuat nilai ujian");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch academic years on component mount
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Fetch scores when selectedAcademicYearId changes
  useEffect(() => {
    if (selectedAcademicYearId) {
      fetchScores(selectedAcademicYearId);
    }
  }, [selectedAcademicYearId]);

  const groupScores = {
    DAILY_TEST: [],
    START_SEMESTER_TEST: [],
    MIDTERM: [],
    FINAL_EXAM: [],
  };

  scores.forEach((item) => {
    if (item.jenis && groupScores[item.jenis]) {
      groupScores[item.jenis].push(item);
    } else {
      console.warn("Unknown or undefined score type:", item.jenis, "for item:", item);
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

          <div className="flex justify-end mb-4">
            {/* Render AcademicYearFilter */}
            <AcademicYearFilter
              academicYears={academicYears}
              selectedId={selectedAcademicYearId}
              onChange={setSelectedAcademicYearId}
            />
          </div>

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
