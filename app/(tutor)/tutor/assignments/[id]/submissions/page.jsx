"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

export default function AssignmentSubmissionsPage() {
  const { id } = useParams(); // assignmentId
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.get(`/tutor/assignments/${id}/submissions`);
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
      cell: (row) => row.nama,
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
      cell: (row) => (row.nilai != null ? row.nilai : "-"),
    },
    {
      header: "Waktu Kumpul",
      cell: (row) =>
        row.waktuKumpul
          ? new Date(row.waktuKumpul).toLocaleString("id-ID")
          : "-",
    },
    {
      header: "Aksi",
      cell: (row) =>
        row.status === "NOT_STARTED" ? (
          <span className="text-sm text-muted-foreground italic">
            Belum mengerjakan
          </span>
        ) : (
          <button
            onClick={() => router.push(`/tutor/submissions/${row.id}/review`)}
            className="text-sm text-blue-600 hover:underline"
          >
            Review
          </button>
        ),
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
            href: `/tutor/assignments/${assignment.id}/submissions`,
          },
          { label: "Review" }, // aktif (tanpa href)
        ]}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Daftar Jawaban</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={submissions}
            columns={columns}
            loadingMessage="Memuat jawaban..."
            emptyMessage="Belum ada siswa yang mengerjakan"
            keyExtractor={(item) => item.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
