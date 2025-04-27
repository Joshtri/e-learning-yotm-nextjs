"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function HomeroomExamsScoresPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/homeroom/exams-scores");
      setData(res.data.data || []);
    } catch (error) {
      console.error("Gagal memuat rekap nilai ujian:", error);
      toast.error("Gagal memuat rekap nilai ujian");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Rekap Nilai Ujian"
        description="Pantau nilai ujian siswa di kelas Anda."
        breadcrumbs={[
          { label: "Dashboard", href: "/homeroom/dashboard" },
          { label: "Rekap Nilai Ujian" },
        ]}
        icon={<BarChart3 className="h-6 w-6" />}
      />

      {isLoading ? (
        <p>Memuat data...</p>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {data.map((student) => (
            <AccordionItem key={student.studentId} value={student.studentId}>
              <AccordionTrigger>{student.namaLengkap}</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Ujian Harian</TableHead>
                      <TableHead>Ujian Awal Semester</TableHead>
                      <TableHead>Ujian Tengah Semester</TableHead>
                      <TableHead>Ujian Akhir Semester</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.mapel && student.mapel.length > 0 ? (
                      student.mapel.map((subject) => (
                        <TableRow key={subject.mataPelajaran}>
                          <TableCell>{subject.mataPelajaran}</TableCell>
                          <TableCell>{subject.DAILY_TEST ?? "-"}</TableCell>
                          <TableCell>
                            {subject.START_SEMESTER_TEST ?? "-"}
                          </TableCell>
                          <TableCell>{subject.MIDTERM ?? "-"}</TableCell>
                          <TableCell>{subject.FINAL_EXAM ?? "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Tidak ada data nilai
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
