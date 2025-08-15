// File: app/siswa/learning-materials/page.jsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";

// Helpers
const extractFirstUrl = (text = "") => {
  const m = String(text).match(/https?:\/\/[^\s)]+/i);
  return m ? m[0] : null;
};
const isYouTubeUrl = (url = "") =>
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);

const getRawType = (m) =>
  (m?.tipeMateri || m?.tipe || "").toString().trim().toUpperCase();

const getType = (m) => {
  const raw = getRawType(m);
  if (raw === "LINK_YOUTUBE") return "LINK_YOUTUBE";
  if (raw === "FILE") return "FILE";
  // fallback deteksi dari URL
  const url = m?.fileUrl || extractFirstUrl(m?.konten || "");
  return isYouTubeUrl(url) ? "LINK_YOUTUBE" : "FILE";
};

const getTypeLabel = (m) =>
  getType(m) === "LINK_YOUTUBE" ? "Link YouTube" : "File";

export default function LearningMaterialsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["siswa-materi-pelajaran"],
    queryFn: async () => {
      const res = await axios.get("/api/student/materi-pelajaran");
      return res.data.data;
    },
  });

  return (
    <>
      <PageHeader
        title="Materi Pembelajaran"
        description="Daftar materi pembelajaran yang tersedia untuk siswa."
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Materi Pembelajaran" },
        ]}
      />

      <div className="space-y-6 mt-6">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {isError && <p className="text-red-500 text-sm">Gagal memuat data.</p>}

        {!isLoading &&
          (data?.length ? (
            data.map((mapel) => (
              <Card key={mapel.mapelId}>
                <CardHeader>
                  <CardTitle className="text-lg">{mapel.namaMapel}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {mapel.materi?.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Belum ada materi.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Judul Materi</TableHead>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Aksi</TableHead>
                          <TableHead>Tanggal Upload</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mapel.materi.map((materi) => {
                          const tipe = getType(materi);
                          const url =
                            materi.fileUrl ||
                            extractFirstUrl(materi.konten) ||
                            null;

                          return (
                            <TableRow key={materi.id}>
                              <TableCell className="max-w-[360px]">
                                <div className="truncate">{materi.judul}</div>
                              </TableCell>

                              <TableCell>{getTypeLabel(materi)}</TableCell>

                              <TableCell>
                                {url ? (
                                  tipe === "LINK_YOUTUBE" ? (
                                    // Link YouTube → hanya Buka
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm"
                                    >
                                      Buka
                                    </a>
                                  ) : (
                                    // File → Lihat + Unduh
                                    <div className="flex items-center gap-3">
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                      >
                                        Lihat
                                      </a>
                                      <a
                                        href={url}
                                        download
                                        className="text-gray-600 hover:underline text-sm"
                                      >
                                        Unduh
                                      </a>
                                    </div>
                                  )
                                ) : (
                                  "-"
                                )}
                              </TableCell>

                              <TableCell>
                                {materi.createdAt
                                  ? new Date(
                                      materi.createdAt
                                    ).toLocaleDateString("id-ID", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-sm">
                  Tidak ada mata pelajaran ditemukan.
                </p>
              </CardContent>
            </Card>
          ))}
      </div>
    </>
  );
}
