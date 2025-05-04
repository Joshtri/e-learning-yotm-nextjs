"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const statusMap = {
  NOT_STARTED: "Belum Dimulai",
  IN_PROGRESS: "Sedang Dikerjakan",
  SUBMITTED: "Sudah Dikumpulkan",
  GRADED: "Sudah Dinilai",
};

const jenisUjianMap = {
  MIDTERM: "Ujian Tengah Semester",
  FINAL: "Ujian Akhir Semester",
  EXERCISE: "Latihan",
  DAILY: "Ulangan Harian",
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axios.get("/api/academic-years");
        const years = Array.isArray(res.data?.data?.academicYears)
          ? res.data.data.academicYears
          : [];
        setAcademicYears(years);

        const active = years.find((y) => y.isActive);
        if (active) {
          setSelectedYear(active.id);
        }
      } catch (err) {
        console.error("Gagal mengambil tahun ajaran:", err);
      }
    };

    fetchYears();
  }, []);

  // Fetch submissions berdasarkan tahun ajaran
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedYear) return;
      setLoading(true);
      try {
        const res = await axios.get(
          `/api/tutor/submissions?academicYearId=${selectedYear}`
        );
        setSubmissions(res.data.data || []);
      } catch (error) {
        console.error("Gagal mengambil data submission:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [selectedYear]);

  const statusColor = {
    NOT_STARTED: "bg-gray-200 text-gray-700",
    IN_PROGRESS: "bg-yellow-200 text-yellow-800",
    SUBMITTED: "bg-blue-200 text-blue-800",
    GRADED: "bg-green-200 text-green-800",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Daftar Pengumpulan Siswa</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Tahun Ajaran</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="p-2 border rounded w-full max-w-xs"
        >
          {academicYears.map((year) => (
            <option key={year.id} value={year.id}>
              {year.tahunMulai}/{year.tahunSelesai}{" "}
              {year.isActive ? "(Aktif)" : ""}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[75vh] pr-2">
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <p className="text-muted-foreground text-center">
                Belum ada pengumpulan.
              </p>
            ) : (
              submissions.map((sub) => (
                <Card key={sub.id}>
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {sub.assignment?.judul || sub.quiz?.judul}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {sub.assignment?.classSubjectTutor?.class?.namaKelas ||
                          sub.quiz?.classSubjectTutor?.class?.namaKelas}
                        {" • "}
                        {sub.assignment?.classSubjectTutor?.subject
                          ?.namaMapel ||
                          sub.quiz?.classSubjectTutor?.subject?.namaMapel}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${statusColor[sub.status] || "bg-gray-100"}`}
                    >
                      {statusMap[sub.status] || sub.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium">Siswa:</span>{" "}
                      {sub.student.namaLengkap}
                    </p>
                    <p>
                      <span className="font-medium">NISN:</span>{" "}
                      {sub.student.nisn}
                    </p>
                    {sub.assignment?.jenis && (
                      <p>
                        <span className="font-medium">Jenis Ujian:</span>{" "}
                        {jenisUjianMap[sub.assignment.jenis] ||
                          sub.assignment.jenis}
                      </p>
                    )}
                    {sub.nilai != null && (
                      <p>
                        <span className="font-medium">Nilai:</span> {sub.nilai}
                      </p>
                    )}
                    {sub.waktuKumpul && (
                      <p>
                        <span className="font-medium">Waktu Kumpul:</span>{" "}
                        {format(
                          new Date(sub.waktuKumpul),
                          "d MMM yyyy, HH:mm",
                          { locale: id }
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
