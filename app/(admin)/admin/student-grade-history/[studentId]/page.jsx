"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, GraduationCap, Download } from "lucide-react";
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

// ─── PDF generator per rapor entry ─────────────────────────────────────
async function downloadRaporPDF(student, entry) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const {
    academicYear,
    class: kelas,
    naikKelas,
    nilaiAkhir,
    finalScores,
    behaviorScore,
  } = entry;

  const tahunAjaran = `${academicYear.tahunMulai}/${academicYear.tahunSelesai} - ${academicYear.semester}`;
  const namaKelas = kelas.namaKelas;
  const namaPaket = kelas.namaPaket || "-";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  // ── Header ──────────────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RAPOR SISWA", pageW / 2, y, { align: "center" });
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tahun Ajaran: ${tahunAjaran}`, pageW / 2, y, { align: "center" });
  y += 5;
  doc.text(`Kelas: ${namaKelas}  |  Program: ${namaPaket}`, pageW / 2, y, {
    align: "center",
  });
  y += 2;

  // Garis pemisah
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, pageW - 14, y + 2);
  y += 7;

  // ── Info Siswa ───────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Identitas Siswa", 14, y);
  y += 5;

  const infoRows = [
    ["Nama Lengkap", student.namaLengkap || "-"],
    ["NISN", student.nisn || "-"],
    ["NIS", student.nis || "-"],
    ["Email", student.email || "-"],
    [
      "Jenis Kelamin",
      student.jenisKelamin
        ? student.jenisKelamin === "MALE"
          ? "Laki-laki"
          : student.jenisKelamin === "FEMALE"
            ? "Perempuan"
            : "Lainnya"
        : "-",
    ],
    ["Tempat Lahir", student.tempatLahir || "-"],
    [
      "Tanggal Lahir",
      student.tanggalLahir
        ? new Date(student.tanggalLahir).toLocaleDateString("id-ID", {
            dateStyle: "long",
          })
        : "-",
    ],
  ];

  doc.setFont("helvetica", "normal");
  const colLabel = 14;
  const colColon = 55;
  const colValue = 60;

  infoRows.forEach(([label, value]) => {
    doc.text(label, colLabel, y);
    doc.text(":", colColon, y);
    doc.text(String(value), colValue, y);
    y += 5;
  });

  y += 2;
  doc.setLineWidth(0.3);
  doc.line(14, y, pageW - 14, y);
  y += 5;

  // ── Status Kenaikan ──────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.text("Status Kenaikan Kelas:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(naikKelas ? "Naik Kelas" : "Mengulang", 65, y);
  y += 5;

  if (nilaiAkhir != null) {
    doc.setFont("helvetica", "bold");
    doc.text("Rata-rata Nilai Akhir:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(nilaiAkhir.toFixed(2), 65, y);
    y += 5;
  }

  y += 3;

  // ── Nilai per Mata Pelajaran ─────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Nilai per Mata Pelajaran", 14, y);
  y += 4;

  if (finalScores.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Belum ada nilai mata pelajaran tercatat.", 14, y);
    y += 7;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["No", "Mata Pelajaran", "Nilai Akhir", "Huruf", "Predikat"]],
      body: finalScores.map((fs, idx) => {
        const nilai = fs.nilaiAkhir;
        const huruf =
          nilai >= 90
            ? "A"
            : nilai >= 80
              ? "B"
              : nilai >= 70
                ? "C"
                : nilai >= 60
                  ? "D"
                  : "E";
        const predikat =
          nilai >= 90
            ? "Sangat Baik"
            : nilai >= 80
              ? "Baik"
              : nilai >= 70
                ? "Cukup"
                : nilai >= 60
                  ? "Kurang"
                  : "Sangat Kurang";
        return [
          idx + 1,
          fs.namaMapel || "-",
          nilai != null ? nilai.toFixed(2) : "-",
          huruf,
          predikat,
        ];
      }),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // ── Nilai Sikap & Kehadiran ──────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Nilai Sikap & Kehadiran", 14, y);
  y += 4;

  if (!behaviorScore) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Belum ada nilai sikap tercatat.", 14, y);
    y += 7;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Komponen", "Nilai"]],
      body: [
        ["Spiritual", behaviorScore.spiritual?.toFixed(2) ?? "-"],
        ["Sosial", behaviorScore.sosial?.toFixed(2) ?? "-"],
        ["Kehadiran", behaviorScore.kehadiran?.toFixed(2) ?? "-"],
        ...(behaviorScore.catatan ? [["Catatan", behaviorScore.catatan]] : []),
      ],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [236, 253, 245] },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Footer ───────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text(
    `Dicetak pada: ${new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`,
    pageW / 2,
    pageH - 8,
    { align: "center" },
  );

  // Save
  const safeName = (student.namaLengkap || "siswa")
    .replace(/\s+/g, "-")
    .toLowerCase();
  const safeYear = tahunAjaran.replace(/\s+/g, "-").replace(/\//g, "-");
  doc.save(`rapor-${safeName}-${safeYear}.pdf`);
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2">
      <span className="text-sm text-muted-foreground w-32 shrink-0">
        {label}
      </span>
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
  const [isDownloadingId, setIsDownloadingId] = useState(null);

  const handleDownloadPDF = async (entry) => {
    setIsDownloadingId(entry.academicYearId);
    try {
      await downloadRaporPDF(student, entry);
    } catch (err) {
      console.error("Gagal membuat PDF:", err);
      toast.error("Gagal membuat PDF rapor");
    } finally {
      setIsDownloadingId(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(
          `/admin/student-grade-history/${studentId}`,
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
    // {
    //   header: "Kode",
    //   cell: (row) => (
    //     <span className="text-sm text-muted-foreground">
    //       {row.kodeMapel || "-"}
    //     </span>
    //   ),
    // },
    {
      header: "Nilai Akhir",
      cell: (row) => (
        <span className="font-semibold">
          {row.nilaiAkhir?.toFixed(2) ?? "-"}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground text-sm">
          Memuat data rapor siswa...
        </div>
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
  const statusInfo = statusMap[student.status] || {
    label: student.status,
    variant: "outline",
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Riwayat Rapor Siswa"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          {
            label: "Riwayat Rapor Siswa",
            href: "/admin/student-grade-history",
          },
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
            const {
              academicYear,
              class: kelas,
              nilaiAkhir,
              finalScores,
              behaviorScore,
            } = entry;

            // Gunakan nilaiAkhir dari history, atau hitung sendiri dari finalScores
            const rataRata =
              nilaiAkhir != null
                ? nilaiAkhir
                : finalScores.length > 0
                  ? finalScores.reduce(
                      (sum, fs) => sum + (fs.nilaiAkhir ?? 0),
                      0,
                    ) / finalScores.length
                  : null;

            const label = `${kelas?.namaKelas ?? "-"} | ${academicYear.tahunMulai}/${academicYear.tahunSelesai} ${academicYear.semester}${rataRata != null ? ` | Rata-rata: ${rataRata.toFixed(2)}` : ""}`;

            return (
              <AccordionItem
                key={entry.academicYearId}
                value={entry.academicYearId}
              >
                <AccordionTrigger className="text-sm font-semibold text-left">
                  {label}
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* Tombol Download PDF */}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-blue-500 text-blue-600 hover:bg-blue-50"
                      disabled={isDownloadingId === entry.academicYearId}
                      onClick={() => handleDownloadPDF(entry)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {isDownloadingId === entry.academicYearId
                        ? "Membuat PDF..."
                        : "Unduh PDF Rapor"}
                    </Button>
                  </div>
                  {/* Row info */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Program: </span>
                      <span className="font-medium">
                        {kelas?.namaPaket || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Final Scores Table */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Nilai per Mata Pelajaran
                    </h4>
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
                        keyExtractor={(row, index) =>
                          `${entry.academicYearId}-${index}`
                        }
                      />
                    )}
                  </div>

                  {/* Behavior Score Card */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Nilai Sikap & Kehadiran
                    </h4>
                    {behaviorScore ? (
                      <div className="rounded-md border bg-muted/30 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Spiritual
                          </p>
                          <p className="text-sm font-semibold">
                            {behaviorScore.spiritual?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Sosial
                          </p>
                          <p className="text-sm font-semibold">
                            {behaviorScore.sosial?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Kehadiran
                          </p>
                          <p className="text-sm font-semibold">
                            {behaviorScore.kehadiran?.toFixed(2)}
                          </p>
                        </div>
                        {behaviorScore.catatan && (
                          <div className="col-span-2 sm:col-span-4">
                            <p className="text-xs text-muted-foreground">
                              Catatan
                            </p>
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
