// File: app/siswa/learning-materials/page.jsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown, BookOpen, FileText, Play } from "lucide-react";
import { useState } from "react";

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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ["siswa-materi-pelajaran"],
    queryFn: async () => {
      const res = await axios.get("/api/student/materi-pelajaran");
      return res.data.data;
    },
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedMateri = (materi) => {
    if (!sortConfig.key) return materi;
    
    return [...materi].sort((a, b) => {
      if (sortConfig.key === 'pertemuan') {
        const aVal = parseInt(a.pertemuan) || 1;
        const bVal = parseInt(b.pertemuan) || 1;
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4" /> 
      : <ArrowDown className="w-4 h-4" />;
  };

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
              <Card key={mapel.mapelId} className="shadow-sm border-l-4 border-l-primary/20 hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {mapel.namaMapel}
                    <Badge variant="outline" className="ml-auto">
                      {mapel.materi?.length || 0} materi
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {mapel.materi?.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">
                        Belum ada materi tersedia.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
                            onClick={() => handleSort('pertemuan')}
                          >
                            <div className="flex items-center gap-2">
                              Pertemuan
                              {getSortIcon('pertemuan')}
                            </div>
                          </TableHead>
                          <TableHead>Judul Materi</TableHead>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Aksi</TableHead>
                          <TableHead>Tanggal Upload</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSortedMateri(mapel.materi).map((materi) => {
                          const tipe = getType(materi);
                          const url =
                            materi.fileUrl ||
                            extractFirstUrl(materi.konten) ||
                            null;

                          return (
                            <TableRow key={materi.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium">
                                <Badge variant="secondary" className="font-normal">
                                  Pertemuan {materi.pertemuan || "1"}
                                </Badge>
                              </TableCell>

                              <TableCell className="max-w-[360px]">
                                <div className="truncate font-medium">{materi.judul}</div>
                              </TableCell>

                              <TableCell>
                                <Badge 
                                  variant={tipe === "LINK_YOUTUBE" ? "destructive" : "default"}
                                  className="flex items-center gap-1 w-fit"
                                >
                                  {tipe === "LINK_YOUTUBE" ? <Play className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                  {getTypeLabel(materi)}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                {url ? (
                                  tipe === "LINK_YOUTUBE" ? (
                                    <Badge 
                                      variant="destructive" 
                                      className="cursor-pointer hover:bg-destructive/90 transition-colors"
                                      asChild
                                    >
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1"
                                      >
                                        <Play className="w-3 h-3" />
                                        Buka
                                      </a>
                                    </Badge>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant="outline" 
                                        className="cursor-pointer hover:bg-muted transition-colors"
                                        asChild
                                      >
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1"
                                        >
                                          <FileText className="w-3 h-3" />
                                          Lihat
                                        </a>
                                      </Badge>
                                      <Badge 
                                        variant="secondary" 
                                        className="cursor-pointer hover:bg-secondary/80 transition-colors"
                                        asChild
                                      >
                                        <a
                                          href={url}
                                          download
                                          className="flex items-center gap-1"
                                        >
                                          <ArrowDown className="w-3 h-3" />
                                          Unduh
                                        </a>
                                      </Badge>
                                    </div>
                                  )
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>

                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  {materi.createdAt
                                    ? new Date(
                                        materi.createdAt
                                      ).toLocaleDateString("id-ID", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "-"}
                                </div>
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
              <CardContent className="py-12">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Tidak ada mata pelajaran
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Belum ada mata pelajaran yang tersedia untuk saat ini.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </>
  );
}
