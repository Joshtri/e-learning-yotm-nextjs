"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { GraduationCap, Users, BookOpen, Award } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

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
  const [filters, setFilters] = useState({
    subjectId: "",
  });

  const fetchScores = async () => {
    try {
      setLoading(true);
      const res = await api.get("/homeroom/academic-scores");
      setData(
        res.data || {
          students: [],
          quizzes: [],
          assignments: [],
          filterOptions: { subjects: [], classes: [], academicYears: [] },
          classInfo: null,
        }
      );
    } catch (error) {
      toast.error("Gagal memuat rekap nilai siswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const { students, quizzes, assignments, filterOptions, classInfo } = data;

  // Group quizzes and assignments by subject when no subject filter is applied
  const groupedQuizzes = filters.subjectId
    ? quizzes
    : quizzes.reduce((acc, quiz) => {
        const subject = quiz.classSubjectTutor.subject.namaMapel;
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(quiz);
        return acc;
      }, {});

  const groupedAssignments = filters.subjectId
    ? assignments
    : assignments.reduce((acc, assignment) => {
        const subject = assignment.classSubjectTutor.subject.namaMapel;
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(assignment);
        return acc;
      }, {});

  // Filter students and their scores based on selected subject
  const filteredStudents = students.map((student) => {
    if (filters.subjectId) {
      // Filter scores by subject
      const selectedSubject = filterOptions.subjects.find(
        (s) => s.id === filters.subjectId
      );
      const subjectName = selectedSubject?.namaMapel;

      const filteredKuis = student.kuis.filter(
        (k) => k.mataPelajaran === subjectName
      );
      const filteredTugas = student.tugas.filter(
        (t) => t.mataPelajaran === subjectName
      );

      // Recalculate total for this subject only
      const nilaiList = [
        ...filteredKuis.map((k) => k.nilai),
        ...filteredTugas.map((t) => t.nilai),
      ].filter((n) => n !== null);

      const totalNilai =
        nilaiList.length > 0
          ? parseFloat(
              (nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length).toFixed(
                2
              )
            )
          : null;

      return {
        ...student,
        kuis: filteredKuis,
        tugas: filteredTugas,
        totalNilai,
      };
    }
    return student;
  });

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Siswa",
      cell: (row) => <div className="font-medium">{row.nama || "-"}</div>,
    },
    // Dynamic columns for quizzes
    ...(filters.subjectId
      ? quizzes
          .filter((q) => q.classSubjectTutor.subject.id === filters.subjectId)
          .map((quiz) => ({
            header: `Kuis: ${quiz.judul}`,
            cell: (row) => {
              const score = row.kuis.find((k) => k.id === quiz.id);
              return (
                <div className="text-center">
                  {score?.nilai !== null ? score.nilai : "-"}
                </div>
              );
            },
            className: "text-center w-[100px]",
          }))
      : Object.entries(groupedQuizzes).flatMap(([subject, quizzes]) =>
          quizzes.map((quiz) => ({
            header: `${subject} - Kuis: ${quiz.judul}`,
            cell: (row) => {
              const score = row.kuis.find((k) => k.id === quiz.id);
              return (
                <div className="text-center">
                  {score?.nilai !== null ? score.nilai : "-"}
                </div>
              );
            },
            className: "text-center w-[120px]",
          }))
        )),
    // Dynamic columns for assignments
    ...(filters.subjectId
      ? assignments
          .filter((a) => a.classSubjectTutor.subject.id === filters.subjectId)
          .map((assignment) => ({
            header: `Tugas: ${assignment.judul}`,
            cell: (row) => {
              const score = row.tugas.find((t) => t.id === assignment.id);
              return (
                <div className="text-center">
                  {score?.nilai !== null ? score.nilai : "-"}
                </div>
              );
            },
            className: "text-center w-[100px]",
          }))
      : Object.entries(groupedAssignments).flatMap(([subject, assignments]) =>
          assignments.map((assignment) => ({
            header: `${subject} - Tugas: ${assignment.judul}`,
            cell: (row) => {
              const score = row.tugas.find((t) => t.id === assignment.id);
              return (
                <div className="text-center">
                  {score?.nilai !== null ? score.nilai : "-"}
                </div>
              );
            },
            className: "text-center w-[120px]",
          }))
        )),
    {
      header: "Rata-rata",
      cell: (row) => (
        <div className="text-center font-semibold text-blue-600">
          {row.totalNilai !== null ? row.totalNilai : "-"}
        </div>
      ),
      className: "text-center w-[100px]",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Rekap Nilai Akademik"
        description={`Rekap nilai akademik siswa kelas ${
          classInfo?.namaKelas || ""
        } (${classInfo?.program || ""}) - ${classInfo?.tahunAjaran || ""}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Rekap Nilai Akademik" },
        ]}
      />

      {/* Class Info Card */}
      {classInfo && (
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
                  <p className="text-sm text-muted-foreground">Jumlah Siswa</p>
                  <p className="font-medium">{students.length} siswa</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <FilterDropdown
          options={filterOptions.subjects.map((subject) => ({
            value: subject.id,
            label: subject.namaMapel,
          }))}
          onSelect={(value) => setFilters({ ...filters, subjectId: value })}
          label="Mata Pelajaran"
          placeholder="Semua Mata Pelajaran"
        />
      </div>

      {filteredStudents.length > 0 ? (
        <DataTable
          data={filteredStudents}
          columns={columns}
          isLoading={loading}
          loadingMessage="Memuat nilai siswa..."
          emptyMessage="Belum ada data nilai."
          keyExtractor={(item) => item.studentId}
        />
      ) : (
        <EmptyState
          title="Belum ada nilai"
          description="Data nilai akademik siswa belum tersedia."
          icon={<GraduationCap className="h-8 w-8 text-muted-foreground" />}
        />
      )}
    </div>
  );
}
