"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function InputSkillScoresPage() {
  const { classId, subjectId } = useParams();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scores, setScores] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get(
        `/tutor/skill-scores/students?classId=${classId}&subjectId=${subjectId}`
      );
      setStudents(res.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat daftar siswa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (studentId, value) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = Object.entries(scores).map(([studentId, nilai]) => ({
        studentId,
        subjectId,
        nilai: parseFloat(nilai),
      }));

      await api.post("/tutor/skill-scores/submit", {
        classId,
        subjectId,
        scores: payload,
      });
      toast.success("Berhasil menyimpan nilai skill!");
      router.push("/tutor/skill-scores");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan nilai skill");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Input Nilai Skill"
        description="Masukkan nilai skill siswa untuk mata pelajaran ini."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Nilai Skill", href: "/tutor/skill-scores" },
          { label: "Input Nilai Skill" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>Input Nilai Skill</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Tidak ada siswa
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{student.namaLengkap}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={scores[student.id] || ""}
                          onChange={(e) =>
                            handleInputChange(student.id, e.target.value)
                          }
                          placeholder="Nilai 0-100"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSubmit}>Simpan Nilai</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
