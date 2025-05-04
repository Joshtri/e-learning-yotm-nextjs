"use client";

import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

export default function FinalScoresPage() {
  const [data, setData] = useState({ students: [], subjects: [], tahunAjaranId: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFinalScores();
  }, []);

  const fetchFinalScores = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/homeroom/final-scores");
      setData(res.data.data || { students: [], subjects: [] });
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data nilai akhir siswa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFinalScores = async () => {
    try {
      const payload = [];
  
      if (!data.tahunAjaranId) {
        toast.error("Data tahun ajaran tidak ditemukan.");
        return;
      }
  
      data.students.forEach((student) => {
        data.subjects.forEach((subject) => {
          const mapel = student.mapelDetails.find(
            (m) => m.namaMapel === subject.namaMapel
          );
  
          if (!mapel) return;
  
          const komponen = [
            mapel.exercise,
            mapel.quiz,
            mapel.dailyTest,
            mapel.midterm,
            mapel.finalExam,
            mapel.skill,
          ];
  
          const nilaiList = komponen
            .map((n) => (typeof n === "number" ? n : parseFloat(n)))
            .filter((n) => !isNaN(n));
  
          if (nilaiList.length === 0) return;
  
          const nilaiAkhir = (
            nilaiList.reduce((acc, n) => acc + n, 0) / nilaiList.length
          );
  
          payload.push({
            studentId: student.id,
            subjectId: subject.id,
            tahunAjaranId: data.tahunAjaranId, // ✅ fix here
            nilaiAkhir: parseFloat(nilaiAkhir.toFixed(2)),
          });
        });
      });
  
      if (payload.length === 0) {
        toast.warning("Tidak ada data nilai akhir yang valid untuk disimpan.");
        return;
      }
  
      await api.post("/homeroom/final-scores/save", { finalScores: payload });
      toast.success("Nilai akhir berhasil disimpan.");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan nilai akhir");
    }
  };
  
  

  return (
    <div className="p-6">
      <PageHeader
        title="Perhitungan Nilai Akhir"
        description="Data nilai lengkap: Kuis, Tugas, UTS, UAS, Daily Test, Skill, Behavior."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Perhitungan Nilai Akhir" },
        ]}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Rekap Nilai Siswa</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="text-center">
                    No
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Nama
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Kelas
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Program
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Tahun Ajaran
                  </TableHead>

                  {data.subjects.map((subject) => (
                    <TableHead
                      key={subject.id}
                      colSpan={6}
                      className="text-center font-bold"
                    >
                      {subject.namaMapel}
                    </TableHead>
                  ))}

                  <TableHead rowSpan={2} className="text-center">
                    Spiritual
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Sosial
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Kehadiran
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center">
                    Total Nilai
                  </TableHead>
                </TableRow>

                <TableRow>
                  {data.subjects.map((_) => (
                    <>
                      <TableHead className="text-xs text-center">
                        Exercise
                      </TableHead>
                      <TableHead className="text-xs text-center">
                        Quiz
                      </TableHead>
                      <TableHead className="text-xs text-center">
                        Daily Test
                      </TableHead>
                      <TableHead className="text-xs text-center">
                        Midterm
                      </TableHead>
                      <TableHead className="text-xs text-center">
                        Final
                      </TableHead>
                      <TableHead className="text-xs text-center">
                        Skill
                      </TableHead>
                    </>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data.students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center">
                      Tidak ada data siswa
                    </TableCell>
                  </TableRow>
                ) : (
                  data.students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{student.namaLengkap}</TableCell>
                      <TableCell>{student.kelas}</TableCell>
                      <TableCell>{student.program}</TableCell>
                      <TableCell>{student.tahunAjaran}</TableCell>

                      {data.subjects.map((subject) => {
                        const mapel = student.mapelDetails.find(
                          (m) => m.namaMapel === subject.namaMapel
                        ) || {
                          exercise: "-",
                          quiz: "-",
                          dailyTest: "-",
                          midterm: "-",
                          finalExam: "-",
                          skill: "-",
                        };

                        return (
                          <>
                            <TableCell>{mapel.exercise}</TableCell>
                            <TableCell>{mapel.quiz}</TableCell>
                            <TableCell>{mapel.dailyTest}</TableCell>
                            <TableCell>{mapel.midterm}</TableCell>
                            <TableCell>{mapel.finalExam}</TableCell>
                            <TableCell>{mapel.skill}</TableCell>
                          </>
                        );
                      })}

                      <TableCell>
                        {student.behavior?.spiritual ?? "-"}
                      </TableCell>
                      <TableCell>{student.behavior?.sosial ?? "-"}</TableCell>
                      <TableCell>
                        {student.behavior?.kehadiran ?? "-"}
                      </TableCell>

                      <TableCell className="font-bold">
                        {student.nilaiAkhir?.toFixed(2) ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between mt-4 gap-2 flex-wrap">
            <Button variant="outline" onClick={fetchFinalScores}>
              Refresh Data
            </Button> 
            <Button onClick={handleSaveFinalScores}>Simpan Nilai Akhir</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
