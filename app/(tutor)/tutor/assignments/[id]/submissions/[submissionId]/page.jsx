"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function GradeSubmissionPage() {
  const { id, submissionId } = useParams(); // id = assignmentId
  const router = useRouter();
  const [data, setData] = useState(null);
  const [nilai, setNilai] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await api.get(`/tutor/submissions/${submissionId}`);
        setData(res.data.data);
        setNilai(res.data.data.nilai || "");
        setFeedback(res.data.data.feedback || "");
      } catch {
        toast.error("Gagal memuat data");
      }
    };

    fetchSubmission();
  }, [submissionId]);

  const handleSave = async () => {
    try {
      await api.patch(`/tutor/submissions/${submissionId}/grade`, {
        nilai: parseFloat(nilai),
        feedback,
      });
      toast.success("Nilai berhasil disimpan");
      router.back();
    } catch {
      toast.error("Gagal menyimpan nilai");
    }
  };

  if (!data) return <div className="p-6">Memuat...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={`Periksa Jawaban - ${data.student.nama}`}
        description={`Tugas: ${data.assignment.judul}`}
        breadcrumbs={[
          { label: "Tugas", href: "/tutor/assignments" },
          { label: data.assignment.judul, href: `/tutor/assignments/${id}` },
          { label: "Periksa Jawaban" },
        ]}
      />

      <div className="space-y-4 mt-6">
        <div>
          <Label>Jawaban Siswa</Label>
          <Textarea value={data.jawaban || "-"} readOnly />
        </div>
        <div>
          <Label>Nilai</Label>
          <Input
            type="number"
            value={nilai}
            onChange={(e) => setNilai(e.target.value)}
          />
        </div>
        <div>
          <Label>Feedback</Label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        <Button onClick={handleSave}>Simpan Penilaian</Button>
      </div>
    </div>
  );
}
