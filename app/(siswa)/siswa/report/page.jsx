"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GraduationCap, BookOpen, Star, Users, Info } from "lucide-react";
import { toast } from "sonner";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function StudentReportPage() {
  const { data: reportResponse, error, isLoading } = useSWR("/api/student/report", fetcher);
  const reportData = reportResponse?.data || [];

  useEffect(() => {
    if (error) {
      toast.error("Gagal memuat data rapor");
    }
  }, [error]);

  if (isLoading) {
    return (
      <main className="p-6 space-y-6">
        <PageHeader title="Rapor Saya" description="Memuat seluruh riwayat nilai Anda..." />
        <Skeleton className="h-[400px] w-full" />
      </main>
    );
  }

  if (!reportData || reportData.length === 0) {
    return (
      <main className="p-6 space-y-6">
        <PageHeader
          title="Rapor Saya"
          description="Lihat rekapitulasi seluruh nilai Anda selama bersekolah."
          breadcrumbs={[
            { label: "Dashboard", href: "/siswa/dashboard" },
            { label: "Rapor Saya" },
          ]}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold">Belum Ada Data Nilai</p>
            <p className="text-muted-foreground">Data rapor akan muncul setelah tutor atau wali kelas melakukan penilaian akhir.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <PageHeader
        title="Rapor Saya"
        description="Rekapitulasi seluruh nilai Anda selama bersekolah."
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Rapor Saya" },
        ]}
      />

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg dark:bg-blue-900/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Halaman ini menampilkan seluruh riwayat nilai Anda. Sesuai kebijakan, fitur unduh dan cetak tidak tersedia melalui portal siswa.
            </p>
          </div>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={[reportData[0]?.academicYear]} className="space-y-6">
        {reportData.map((year) => (
          <AccordionItem key={year.academicYear} value={year.academicYear} className="border rounded-lg bg-card overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-all">
              <div className="flex items-center gap-3 text-left">
                <GraduationCap className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-bold text-lg">{year.academicYear}</h3>
                  <p className="text-sm text-muted-foreground">Tahun Ajaran & Semester</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="space-y-8">
                {/* Behavior Section */}
                {year.behavior && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-slate-50 dark:bg-slate-900/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Nilai Karakter (Spiritual)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{year.behavior.spiritual || "-"}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-50 dark:bg-slate-900/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          Nilai Karakter (Sosial)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{year.behavior.social || "-"}</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Subjects Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[300px]">Mata Pelajaran</TableHead>
                        <TableHead className="text-center">Nilai Akhir</TableHead>
                        <TableHead className="text-center">Nilai Keterampilan</TableHead>
                        <TableHead>Detail Ujian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {year.subjects.map((subject) => (
                        <TableRow key={subject.name}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              {subject.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-lg">{subject.final || "-"}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium">{subject.skill || "-"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[400px]">
                              {subject.exams.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {subject.exams.map((exam, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] py-0">
                                      {exam.jenis}: {exam.nilai}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
  );
}
