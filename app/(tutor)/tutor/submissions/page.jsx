"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

const statusColor = {
  NOT_STARTED: "bg-gray-200 text-gray-700",
  IN_PROGRESS: "bg-yellow-200 text-yellow-800",
  SUBMITTED: "bg-blue-200 text-blue-800",
  GRADED: "bg-green-200 text-green-800",
};

// SubmissionCard Component
/* eslint-disable react/prop-types */
function SubmissionCard({ submission }) {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-lg font-semibold">
            {submission.assignment?.judul || submission.quiz?.judul}
          </CardTitle>
          <CardDescription className="mt-1">
            {submission.assignment?.classSubjectTutor?.class?.namaKelas ||
              submission.quiz?.classSubjectTutor?.class?.namaKelas}
            {" • "}
            {submission.assignment?.classSubjectTutor?.subject?.namaMapel ||
              submission.quiz?.classSubjectTutor?.subject?.namaMapel}
          </CardDescription>
        </div>
        <Badge className={`${statusColor[submission.status] || "bg-gray-100"}`}>
          {statusMap[submission.status] || submission.status}
        </Badge>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-1">
        <p>
          <span className="font-medium">Siswa:</span>{" "}
          {submission.student.namaLengkap}
        </p>
        <p>
          <span className="font-medium">NISN:</span> {submission.student.nisn}
        </p>
        {submission.assignment?.jenis && (
          <p>
            <span className="font-medium">Jenis :</span>{" "}
            {jenisUjianMap[submission.assignment.jenis] ||
              submission.assignment.jenis}
          </p>
        )}
        {submission.nilai != null && (
          <p>
            <span className="font-medium">Nilai:</span> {submission.nilai}
          </p>
        )}
        {submission.waktuKumpul && (
          <p>
            <span className="font-medium">Waktu Kumpul:</span>{" "}
            {format(new Date(submission.waktuKumpul), "d MMM yyyy, HH:mm", {
              locale: id,
            })}
          </p>
        )}

        <Link href={`/tutor/submissions/${submission.id}/review`} passHref>
          <Button variant="outline" className="mt-2">
            Review
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
/* eslint-enable react/prop-types */

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState({});
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
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
      } catch {
        // Handle error silently
      }
    };

    fetchYears();
  }, []);

  // Fetch submissions berdasarkan tahun ajaran dan mata pelajaran
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedYear) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("academicYearId", selectedYear);
        if (selectedSubject) {
          params.append("subjectId", selectedSubject);
        }

        const res = await axios.get(
          `/api/tutor/submissions?${params.toString()}`
        );
        const responseData = res.data.data || {};
        const subjects = res.data.availableSubjects || [];
        const filtered = res.data.isFiltered || false;

        setSubmissions(responseData);
        setAvailableSubjects(subjects);
        setIsFiltered(filtered);
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [selectedYear, selectedSubject]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Daftar Pengumpulan Siswa</h1>

      <div className="mb-4 flex gap-4">
        <div>
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

        <div>
          <label className="block text-sm font-medium mb-1">
            Mata Pelajaran
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="p-2 border rounded w-full max-w-xs"
          >
            <option value="">Semua Mata Pelajaran</option>
            {availableSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.namaMapel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[75vh] pr-2">
          <div className="space-y-6">
            {isFiltered ? (
              // Filtered view - show flat list
              <div className="space-y-4">
                {Array.isArray(submissions) && submissions.length === 0 ? (
                  <p className="text-muted-foreground text-center">
                    Belum ada pengumpulan.
                  </p>
                ) : (
                  Array.isArray(submissions) &&
                  submissions.map((sub) => (
                    <SubmissionCard key={sub.id} submission={sub} />
                  ))
                )}
              </div>
            ) : (
              // Grouped view - show by subject
              <>
                {Object.keys(submissions).length === 0 ? (
                  <p className="text-muted-foreground text-center">
                    Belum ada pengumpulan.
                  </p>
                ) : (
                  Object.entries(submissions).map(
                    ([subjectName, subjectData]) => (
                      <div key={subjectName} className="space-y-4">
                        <h2 className="text-xl font-semibold text-primary border-b pb-2">
                          {subjectName}
                        </h2>

                        {/* Assignments Section */}
                        {subjectData.assignments &&
                          subjectData.assignments.length > 0 && (
                            <div className="space-y-3">
                              <h3 className="text-lg font-medium text-green-700">
                                📝 Tugas ({subjectData.assignments.length})
                              </h3>
                              <div className="space-y-3 pl-4">
                                {subjectData.assignments.map((sub) => (
                                  <SubmissionCard
                                    key={sub.id}
                                    submission={sub}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Quizzes Section */}
                        {subjectData.quizzes &&
                          subjectData.quizzes.length > 0 && (
                            <div className="space-y-3">
                              <h3 className="text-lg font-medium text-blue-700">
                                📊 Kuis ({subjectData.quizzes.length})
                              </h3>
                              <div className="space-y-3 pl-4">
                                {subjectData.quizzes.map((sub) => (
                                  <SubmissionCard
                                    key={sub.id}
                                    submission={sub}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )
                  )
                )}
              </>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
