"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import AcademicYearFilter from "@/components/AcademicYearFilter";
import { GraduationCap, Users, BookOpen, Award } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AcademicYearFilter } from "@/components/AcademicYearFilter";

const ClassInfoSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <Skeleton className="h-6 w-48" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-sm text-muted-foreground">Kelas</p>
            <Skeleton className="h-5 w-24 mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-sm text-muted-foreground">Program</p>
            <Skeleton className="h-5 w-32 mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-purple-500" />
          <div>
            <p className="text-sm text-muted-foreground">Tahun Ajaran</p>
            <Skeleton className="h-5 w-40 mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-sm text-muted-foreground">Jumlah Siswa</p>
            <Skeleton className="h-5 w-16 mt-1" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function HomeroomAcademicScoresPage() {
  const [data, setData] = useState({
    students: [],
    quizzes: [],
    assignments: [],
    filterOptions: {
      subjects: [],
      classes: [],
      academicYears: [],
    },
    classInfo: null,
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("");

  const fetchScores = useCallback(async (academicYearId) => {
    setLoading(true);
    try {
      const params = academicYearId ? { academicYearId } : {};
      const res = await api.get("/homeroom/academic-scores", { params });
      setData(res.data || {});
      if (res.data?.classInfo?.academicYear?.id && !academicYearId) {
        setSelectedYear(res.data.classInfo.academicYear.id);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Gagal memuat rekap nilai siswa";
      toast.error(errorMessage);
      setData({ students: [], quizzes: [], assignments: [], filterOptions: { subjects: [], classes: [], academicYears: [] }, classInfo: null });
      if (error.response?.data?.filterOptions) {
        setData(prevData => ({ ...prevData, filterOptions: error.response.data.filterOptions }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const handleYearChange = (yearId) => {
    setSelectedYear(yearId);
    fetchScores(yearId);
  };

  const { students, quizzes, assignments, filterOptions, classInfo } = data;

  // Group data by subject
  const groupBySubject = () => {
    const grouped = {};

    (quizzes || []).forEach((quiz) => {
      const subjectName = quiz.classSubjectTutor.subject.namaMapel;
      const subjectId = quiz.classSubjectTutor.subject.id;
      if (!grouped[subjectId]) {
        grouped[subjectId] = {
          name: subjectName,
          quizzes: [],
          assignments: [],
        };
      }
      grouped[subjectId].quizzes.push(quiz);
    });

    (assignments || []).forEach((assignment) => {
      const subjectName = assignment.classSubjectTutor.subject.namaMapel;
      const subjectId = assignment.classSubjectTutor.subject.id;
      if (!grouped[subjectId]) {
        grouped[subjectId] = {
          name: subjectName,
          quizzes: [],
          assignments: [],
        };
      }
      grouped[subjectId].assignments.push(assignment);
    });

    return grouped;
  };

  const subjectGroups = groupBySubject();

  // Generate columns for a specific subject
  const generateSubjectColumns = (subjectId, subjectQuizzes, subjectAssignments) => [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Siswa",
      cell: (row) => <div className="font-medium">{row.nama || "-"}</div>,
      className: "min-w-[200px]",
    },
    ...subjectQuizzes.map((quiz) => ({
      header: `Kuis: ${quiz.judul}`,
      cell: (row) => {
        const score = row.kuis.find((k) => k.id === quiz.id);
        return (
          <div className="text-center">
            {score?.nilai !== null ? score.nilai : "-"}
          </div>
        );
      },
      className: "text-center w-[120px]",
    })),
    ...subjectAssignments.map((assignment) => ({
      header: `Tugas: ${assignment.judul}`,
      cell: (row) => {
        const score = row.tugas.find((t) => t.id === assignment.id);
        return (
          <div className="text-center">
            {score?.nilai !== null ? score.nilai : "-"}
          </div>
        );
      },
      className: "text-center w-[120px]",
    })),
    {
      header: "Rata-rata",
      cell: (row) => {
        // Calculate average for this subject only
        const subjectScores = [
          ...row.kuis
            .filter((k) => subjectQuizzes.some((q) => q.id === k.id))
            .map((k) => k.nilai),
          ...row.tugas
            .filter((t) => subjectAssignments.some((a) => a.id === t.id))
            .map((t) => t.nilai),
        ].filter((n) => n !== null);

        const avg =
          subjectScores.length > 0
            ? (subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length).toFixed(2)
            : "-";

        return <div className="text-center font-semibold text-blue-600">{avg}</div>;
      },
      className: "text-center w-[100px]",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Rekap Nilai Akademik"
        description={
          loading ? (
            <Skeleton className="h-5 w-96 mt-1" />
          ) : (
            `Rekap nilai akademik siswa per mata pelajaran - ${classInfo?.namaKelas || ""} (${classInfo?.program || ""}) - ${classInfo?.tahunAjaran || ""} ${classInfo?.semester || ""}`
          )
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Rekap Nilai Akademik" },
        ]}
      >
         <AcademicYearFilter
          academicYears={(filterOptions?.academicYears || []).map(y => ({ ...y, value: y.id, label: y.label }))}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />
      </PageHeader>

      {/* Class Info Card */}
      {loading ? (
        <ClassInfoSkeleton />
      ) : (
        classInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informasi Kelas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kelas</p>
                    <p className="font-medium">{classInfo.namaKelas}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Program</p>
                    <p className="font-medium">{classInfo.program}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tahun Ajaran</p>
                    <p className="font-medium">{classInfo.tahunAjaran}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Jumlah Siswa
                    </p>
                    <p className="font-medium">{(students || []).length} siswa</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Accordion per Mata Pelajaran */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : Object.keys(subjectGroups).length === 0 ? (
        <EmptyState message="Belum ada data nilai untuk tahun ajaran yang dipilih" />
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {Object.entries(subjectGroups).map(([subjectId, subjectData]) => {
            const totalItems = subjectData.quizzes.length + subjectData.assignments.length;

            return (
              <AccordionItem
                key={subjectId}
                value={subjectId}
                className="border rounded-lg bg-white shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-lg">
                        {subjectData.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        {subjectData.quizzes.length} Kuis
                      </span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        {subjectData.assignments.length} Tugas
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                        {totalItems} Total
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <DataTable
                    data={students || []}
                    columns={generateSubjectColumns(
                      subjectId,
                      subjectData.quizzes,
                      subjectData.assignments
                    )}
                    emptyMessage="Belum ada data nilai untuk mata pelajaran ini"
                    keyExtractor={(item) => item.studentId}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
