"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2">
      <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium">{value || "-"}</span>
    </div>
  );
}

export default function StudentGradeHistoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(
          `/admin/student-grade-history/${studentId}`
        );
        setData(response.data.data);
      } catch (error) {
        console.error("Gagal memuat data rapor siswa:", error);
        toast.error("Gagal memuat data rapor siswa");
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) fetchData();
  }, [studentId]);

  const finalScoreColumns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Mata Pelajaran",
      cell: (row) => <div className="font-medium">{row.namaMapel}</div>,
    },
    {
      header: "Kode",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.kodeMapel || "-"}</span>
      ),
    },
    {
      header: "Nilai Akhir",
      cell: (row) => (
        <span className="font-semibold">{row.nilaiAkhir?.toFixed(2) ?? "-"}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground text-sm">Memuat data rapor siswa...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <EmptyState
          title="Siswa tidak ditemukan"
          description="Data siswa yang Anda cari tidak ada atau telah dihapus."
          icon={<GraduationCap className="h-8 w-8 text-muted-foreground" />}
        />
      </div>
    );
  }

  const { student, history } = data;

  const statusMap = {
    ACTIVE: { label: "Aktif", variant: "default" },
    INACTIVE: { label: "Nonaktif", variant: "secondary" },
    GRADUATED: { label: "Lulus", variant: "outline" },
    DROPPED: { label: "Keluar", variant: "destructive" },
  };
  const statusInfo = statusMap[student.status] || { label: student.status, variant: "outline" };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Riwayat Rapor Siswa"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Riwayat Rapor Siswa", href: "/admin/student-grade-history" },
          { label: student.namaLengkap },
        ]}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/admin/student-grade-history")}
        className="mb-2"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Kembali
      </Button>

      {/* Student Info Card */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{student.namaLengkap}</h2>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <InfoRow label="NISN" value={student.nisn} />
          <InfoRow label="NIS" value={student.nis} />
          <InfoRow label="Email" value={student.email} />
          <InfoRow
            label="Kelas Aktif"
            value={
              student.currentClass
                ? `${student.currentClass.namaKelas}${student.currentClass.namaPaket ? ` — ${student.currentClass.namaPaket}` : ""}`
                : "Tidak ada kelas"
            }
          />
        </div>
      </div>

      {/* History Section */}
      {history.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat nilai"
          description="Siswa ini belum memiliki riwayat kelas atau nilai yang tercatat."
          icon={<GraduationCap className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {history.map((entry) => {
            const { academicYear, class: kelas, naikKelas, nilaiAkhir, finalScores, behaviorScore } = entry;
            const label = `${kelas.namaKelas} | ${academicYear.tahunMulai}/${academicYear.tahunSelesai} ${academicYear.semester}${nilaiAkhir != null ? ` | Rata-rata: ${nilaiAkhir.toFixed(2)}` : ""}`;

            return (
              <AccordionItem key={entry.academicYearId} value={entry.academicYearId}>
                <AccordionTrigger className="text-sm font-semibold text-left">
                  {label}
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* Row info */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Program: </span>
                      <span className="font-medium">{kelas.namaPaket || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status Kenaikan: </span>
                      <Badge variant={naikKelas ? "default" : "destructive"} className="ml-1">
                        {naikKelas ? "Naik Kelas" : "Mengulang"}
                      </Badge>
                    </div>
                  </div>

                  {/* Final Scores Table */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Nilai per Mata Pelajaran</h4>
                    {finalScores.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Belum ada nilai mata pelajaran tercatat.
                      </p>
                    ) : (
                      <DataTable
                        data={finalScores}
                        columns={finalScoreColumns}
                        isLoading={false}
                        emptyMessage="Tidak ada nilai mata pelajaran."
                        keyExtractor={(row, index) => `${entry.academicYearId}-${index}`}
                      />
                    )}
                  </div>

                  {/* Behavior Score Card */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Nilai Sikap & Kehadiran</h4>
                    {behaviorScore ? (
                      <div className="rounded-md border bg-muted/30 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Spiritual</p>
                          <p className="text-sm font-semibold">{behaviorScore.spiritual?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sosial</p>
                          <p className="text-sm font-semibold">{behaviorScore.sosial?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Kehadiran</p>
                          <p className="text-sm font-semibold">{behaviorScore.kehadiran?.toFixed(2)}</p>
                        </div>
                        {behaviorScore.catatan && (
                          <div className="col-span-2 sm:col-span-4">
                            <p className="text-xs text-muted-foreground">Catatan</p>
                            <p className="text-sm">{behaviorScore.catatan}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Belum ada nilai sikap tercatat.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
