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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function InputBehaviorScoresPage() {
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
        `/homeroom/behavior-scores/students?classId=${classId}`
      );
      const studentsData = res.data.data || [];

      setStudents(studentsData);

      const mapped = {};
      for (const s of studentsData) {
        mapped[s.id] = {
          spiritual: s.behaviorScore?.spiritual?.toString() || "",
          sosial: s.behaviorScore?.sosial?.toString() || "",
          kehadiran: s.behaviorScore?.kehadiran?.toString() || "",
          catatan: s.behaviorScore?.catatan || "",
        };
      }

      setScores(mapped);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data siswa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (studentId, field, value) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    try {
      if (students.length === 0) {
        toast.error("Tidak ada data siswa");
        return;
      }
  
      const academicYearId = students[0]?.class?.academicYearId || students[0]?.academicYearId;
  
      if (!academicYearId) {
        toast.error("Tahun ajaran tidak ditemukan di data siswa");
        return;
      }
  
      const payload = Object.entries(scores).map(([studentId, data]) => ({
        studentId,
        spiritual: parseFloat(data.spiritual || 0),
        sosial: parseFloat(data.sosial || 0),
        kehadiran: parseFloat(data.kehadiran || 0),
        catatan: data.catatan || "",
      }));
  
      await api.post("/homeroom/behavior-scores/submit", {
        classId,
        academicYearId,
        scores: payload,
      });
  
      toast.success("Berhasil menyimpan nilai sikap!");
      router.push("/homeroom/behavior-scores");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan nilai sikap");
    }
  };
  

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Input Nilai Sikap"
        description="Masukkan nilai sikap siswa untuk tahun ajaran aktif."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Nilai Sikap", href: "/homeroom/behavior-scores" },
          { label: "Input Nilai Sikap" },
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
                  <TableHead>Spiritual</TableHead>
                  <TableHead>Sosial</TableHead>
                  <TableHead>Kehadiran</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
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
                          value={scores[student.id]?.spiritual || ""}
                          onChange={(e) =>
                            handleChange(
                              student.id,
                              "spiritual",
                              e.target.value
                            )
                          }
                          placeholder="0-100"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={scores[student.id]?.sosial || ""}
                          onChange={(e) =>
                            handleChange(student.id, "sosial", e.target.value)
                          }
                          placeholder="0-100"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={scores[student.id]?.kehadiran || ""}
                          onChange={(e) =>
                            handleChange(
                              student.id,
                              "kehadiran",
                              e.target.value
                            )
                          }
                          placeholder="0-100"
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          rows={2}
                          value={scores[student.id]?.catatan || ""}
                          onChange={(e) =>
                            handleChange(student.id, "catatan", e.target.value)
                          }
                          placeholder="Catatan opsional"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSubmit}>Simpan Nilai Sikap</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
