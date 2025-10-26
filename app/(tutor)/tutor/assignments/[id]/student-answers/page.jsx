"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, CheckCircle } from "lucide-react";

export default function AssignmentSubmissionsPage() {
  const { id } = useParams(); // assignmentId
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.get(`/tutor/assignments/${id}/student-answers`);
      setSubmissions(res.data.data.submissions || []);
      setAssignment(res.data.data.assignment || null);
    } catch {
      toast.error("Gagal memuat jawaban siswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const statusColor = {
    NOT_STARTED: "secondary",
    IN_PROGRESS: "warning",
    SUBMITTED: "primary",
    GRADED: "success",
    LATE: "destructive",
  };

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Siswa",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.nama}</div>
          <div className="text-xs text-muted-foreground">NISN: {row.nisn}</div>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={statusColor[row.status] || "secondary"}>
          {row.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      header: "Nilai",
      cell: (row) => {
        if (row.nilai !== null && row.nilai !== undefined) {
          return (
            <div className="font-bold text-lg text-primary">
              {Number(row.nilai).toFixed(2)}
            </div>
          );
        }
        return <span className="text-muted-foreground">-</span>;
      },
      className: "text-center",
    },
    {
      header: "Waktu Kumpul",
      cell: (row) =>
        row.waktuKumpul
          ? new Date(row.waktuKumpul).toLocaleString("id-ID", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "-",
    },
    {
      header: "Aksi",
      cell: (row) => {
        return (
          <div className="flex gap-2 flex-wrap">
            {/* Tombol Edit/Input Jawaban - selalu ada */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/tutor/assignments/${id}/input-answer/${row.studentId}`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              {row.status === "NOT_STARTED" ? "Input Jawaban" : "Edit Jawaban"}
            </Button>

            {/* Tombol Lihat Jawaban - hanya jika sudah ada submission */}
            {row.status !== "NOT_STARTED" && row.submissionId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/tutor/assignments/${id}/student-answers/${row.submissionId}/view`)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Lihat Jawaban
              </Button>
            )}

            {/* Tombol Beri Nilai - hanya jika sudah ada submission tapi belum dinilai */}
            {row.status !== "NOT_STARTED" && row.submissionId && row.nilai == null && (
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push(`/tutor/assignments/${id}/student-answers/${row.submissionId}/grade`)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Beri Nilai
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) return <div className="p-6">Memuat...</div>;

  return (
    <div className="p-6">
      <PageHeader
        title={`Jawaban Siswa: ${assignment?.judul || "-"}`}
        description={`${
          assignment?.classSubjectTutor?.class?.namaKelas || "-"
        } - ${assignment?.classSubjectTutor?.subject?.namaMapel || "-"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor" },
          { label: "Tugas", href: "/tutor/assignments" },
          {
            label: "Jawaban Siswa",
          },
        ]}
      />

      <DataTable
        data={submissions}
        columns={columns}
        loadingMessage="Memuat jawaban..."
        emptyMessage="Belum ada siswa yang mengerjakan"
        keyExtractor={(item) => item.id}
      />
    </div>
  );
}
