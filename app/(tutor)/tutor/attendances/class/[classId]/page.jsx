"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AttendancePerClassPage() {
  const { classId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get(`/tutor/attendances/class/${classId}`);
        setSessions(res.data.data || []);
      } catch (error) {
        console.error("Gagal memuat presensi kelas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [classId]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Riwayat Presensi Kelas"
        description="Menampilkan daftar sesi presensi untuk kelas ini."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Presensi", href: "/tutor/attendances" },
          { label: "Riwayat Presensi Kelas" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Sesi Presensi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Tidak ada sesi presensi
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        {new Date(session.tanggal).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        {session.academicYear
                          ? `${session.academicYear.tahunMulai}/${session.academicYear.tahunSelesai}`
                          : "-"}
                      </TableCell>
                      <TableCell>{session.keterangan || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/tutor/attendances/${session.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Lihat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
