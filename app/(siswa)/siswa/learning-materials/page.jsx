"use client";

import { PageHeader } from "@/components/ui/page-header";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

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
          data?.map((mapel) => (
            <Card key={mapel.mapelId}>
              <CardHeader>
                <CardTitle className="text-lg">{mapel.namaMapel}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {mapel.materi.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Belum ada materi.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judul Materi</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead>Tanggal Upload</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mapel.materi.map((materi) => (
                        <TableRow key={materi.id}>
                          <TableCell>{materi.judul}</TableCell>
                          <TableCell>{materi.tipe || "-"}</TableCell>
                          <TableCell>
                            {materi.fileUrl ? (
                              <Link
                                href={materi.fileUrl}
                                target="_blank"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Buka
                              </Link>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(materi.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </>
  );
}
