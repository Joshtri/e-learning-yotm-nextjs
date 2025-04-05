"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ReviewSubmissionDialog({ submissionId, onClose }) {
  const [data, setData] = useState(null);
  const [nilai, setNilai] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!submissionId) return;

    const fetchSubmission = async () => {
      try {
        const res = await api.get(`/tutor/submissions/${submissionId}`);
        const fetched = res.data.data;
        setData(fetched);
        setNilai(fetched?.nilai ?? "");
        setFeedback(fetched?.feedback ?? "");
      } catch {
        toast.error("Gagal memuat data submission");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  const handleSubmit = async () => {
    try {
      await api.patch(`/tutor/submissions/${submissionId}`, {
        nilai: parseFloat(nilai),
        feedback,
      });
      toast.success("Penilaian berhasil disimpan");
      onClose?.();
    } catch {
      toast.error("Gagal menyimpan penilaian");
    }
  };

  if (loading || !data) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Koreksi Jawaban</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {data?.answers?.length > 0 ? (
            data.answers.map((ans, i) => (
              <div key={ans.id} className="border rounded p-3">
                <p className="font-medium">Soal {i + 1}</p>
                <p className="text-muted-foreground mb-2">
                  {ans.question?.teks || "-"}
                </p>
                <p className="text-sm">
                  <strong>Jawaban:</strong> {ans.jawaban || "-"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground italic">
              Belum ada jawaban ditemukan.
            </p>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium">Nilai</label>
            <Input
              type="number"
              value={nilai}
              onChange={(e) => setNilai(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Feedback</label>
            <Textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          <div className="text-right pt-4">
            <Button onClick={handleSubmit}>Simpan Penilaian</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
