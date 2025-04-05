"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function NilaiSiswaPage() {
  const [data, setData] = useState({
    students: [],
    quizzes: [],
    assignments: [],
    filterOptions: {
      subjects: [],
      classes: [],
      academicYears: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subjectId: "",
    classId: "",
    academicYearId: "",
  });

  const fetchNilai = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.subjectId) params.append("subjectId", filters.subjectId);
      if (filters.classId) params.append("classId", filters.classId);
      if (filters.academicYearId)
        params.append("academicYearId", filters.academicYearId);

      const res = await axios.get(`/api/students-scores?${params.toString()}`);
      setData(res.data);
    } catch (error) {
      console.error("Gagal mengambil data nilai siswa:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNilai();
  }, [filters]);

  const { students, quizzes, assignments, filterOptions } = data;

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

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Rekap Nilai Siswa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="w-full md:w-auto">
            <Select
              value={filters.subjectId}
              onValueChange={(value) =>
                setFilters({ ...filters, subjectId: value })
              }
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Pilih Mata Pelajaran" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.namaMapel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Select
              value={filters.classId}
              onValueChange={(value) =>
                setFilters({ ...filters, classId: value })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.namaKelas} ({cls.academicYear.tahunMulai}/
                    {cls.academicYear.tahunSelesai})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Select
              value={filters.academicYearId}
              onValueChange={(value) =>
                setFilters({ ...filters, academicYearId: value })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Tahun Ajaran" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.tahunMulai}/{year.tahunSelesai}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              setFilters({
                subjectId: undefined,
                classId: undefined,
                academicYearId: undefined,
              })
            }
          >
            Reset Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Tahun Ajaran</TableHead>

                {/* Show quizzes grouped by subject if no subject filter */}
                {!filters.subjectId
                  ? Object.entries(groupedQuizzes).map(
                      ([subject, subjectQuizzes]) => (
                        <TableHead
                          key={subject}
                          colSpan={subjectQuizzes.length}
                        >
                          <div className="text-center font-bold">{subject}</div>
                          <div className="flex">
                            {subjectQuizzes.map((q, i) => (
                              <span key={q.id} className="flex-1 text-xs">
                                Kuis {i + 1}
                              </span>
                            ))}
                          </div>
                        </TableHead>
                      )
                    )
                  : quizzes.map((q, i) => (
                      <TableHead key={q.id}>Kuis {i + 1}</TableHead>
                    ))}

                {/* Show assignments grouped by subject if no subject filter */}
                {!filters.subjectId
                  ? Object.entries(groupedAssignments).map(
                      ([subject, subjectAssignments]) => (
                        <TableHead
                          key={subject}
                          colSpan={subjectAssignments.length}
                        >
                          <div className="text-center font-bold">{subject}</div>
                          <div className="flex">
                            {subjectAssignments.map((a, i) => (
                              <span key={a.id} className="flex-1 text-xs">
                                Tugas {i + 1}
                              </span>
                            ))}
                          </div>
                        </TableHead>
                      )
                    )
                  : assignments.map((a, i) => (
                      <TableHead key={a.id}>Tugas {i + 1}</TableHead>
                    ))}

                {filters.subjectId && (
                  <>
                    <TableHead>UTS</TableHead>
                    <TableHead>UAS</TableHead>
                  </>
                )}

                <TableHead>Total Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({
                      length: 5 + quizzes.length + assignments.length,
                    }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Tidak ada data nilai siswa.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((item, index) => (
                  <TableRow key={item.studentId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.nama}</TableCell>
                    <TableCell>{item.kelas}</TableCell>
                    <TableCell>{item.program}</TableCell>
                    <TableCell>{item.tahunAjaran}</TableCell>

                    {/* Display quiz scores */}
                    {!filters.subjectId
                      ? Object.values(groupedQuizzes)
                          .flat()
                          .map((quiz) => {
                            const studentQuiz = item.kuis.find(
                              (k) => k.id === quiz.id
                            );
                            return (
                              <TableCell key={quiz.id}>
                                {studentQuiz?.nilai ?? "-"}
                              </TableCell>
                            );
                          })
                      : item.kuis.map((k) => (
                          <TableCell key={k.id}>{k.nilai ?? "-"}</TableCell>
                        ))}

                    {/* Display assignment scores */}
                    {!filters.subjectId
                      ? Object.values(groupedAssignments)
                          .flat()
                          .map((assignment) => {
                            const studentAssignment = item.tugas.find(
                              (t) => t.id === assignment.id
                            );
                            return (
                              <TableCell key={assignment.id}>
                                {studentAssignment?.nilai ?? "-"}
                              </TableCell>
                            );
                          })
                      : item.tugas.map((t) => (
                          <TableCell key={t.id}>{t.nilai ?? "-"}</TableCell>
                        ))}

                    {filters.subjectId && (
                      <>
                        <TableCell>{item.nilaiUTS ?? "-"}</TableCell>
                        <TableCell>{item.nilaiUAS ?? "-"}</TableCell>
                      </>
                    )}

                    <TableCell className="font-bold">
                      {item.totalNilai ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
