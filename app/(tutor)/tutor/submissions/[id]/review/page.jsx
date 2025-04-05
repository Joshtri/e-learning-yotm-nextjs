"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function SubmissionReviewPage() {
  const { id } = useParams(); // submissionId
  const router = useRouter();

  const [data, setData] = useState(null);
  const [nilai, setNilai] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchSubmission = async () => {
    try {
      const res = await api.get(`/tutor/submissions/${id}`);
      const fetched = res.data.data;
      setData(fetched);
      setNilai(fetched.nilai ?? "");
      setFeedback(fetched.feedback ?? "");
    } catch {
      toast.error("Gagal memuat submission");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const handleSubmit = async () => {
    if (!nilai) {
      toast.error("Nilai wajib diisi");
      return;
    }

    const nilaiFinal = Math.max(0, Math.min(100, Number.parseFloat(nilai)));
    setSubmitting(true);

    try {
      await api.patch(`/tutor/submissions/${id}`, {
        nilai: nilaiFinal,
        feedback,
      });
      toast.success("Penilaian berhasil disimpan");
      router.back();
    } catch {
      toast.error("Gagal menyimpan penilaian");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Data tidak ditemukan</h2>
        <p className="text-muted-foreground mt-2">
          Submission tidak ditemukan atau telah dihapus
        </p>
        <Button onClick={() => router.back()} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (!score) return "text-gray-500";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Review Jawaban Siswa`}
        description={`Tugas: ${data.assignment?.judul}`}
        actions={
          <Button onClick={() => router.back()} variant="outline">
            Kembali
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Submissions", href: "/tutor/submissions" },
          { label: "Review" },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Jawaban Siswa</CardTitle>
                {data.nilai && (
                  <Badge
                    variant="outline"
                    className={getScoreColor(data.nilai)}
                  >
                    Nilai: {data.nilai}
                  </Badge>
                )}
              </div>
              <CardDescription>
                Dikumpulkan pada{" "}
                {new Date(data.createdAt).toLocaleString("id-ID")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="answers">
                <TabsList className="mb-4">
                  <TabsTrigger value="answers">Jawaban</TabsTrigger>
                  <TabsTrigger value="assignment">Detail Tugas</TabsTrigger>
                </TabsList>

                <TabsContent value="answers" className="space-y-4">
                  {data.answers && data.answers.length > 0 ? (
                    data.answers.map((ans, i) => (
                      <div
                        key={ans.id}
                        className="border rounded-lg p-4 bg-card"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="bg-primary/10">
                            Soal {i + 1}
                          </Badge>
                          {ans.isCorrect === true && (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            >
                              Benar
                            </Badge>
                          )}
                          {ans.isCorrect === false && (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            >
                              Salah
                            </Badge>
                          )}
                        </div>
                        <div className="mb-3 text-muted-foreground text-sm">
                          {ans.question?.teks || "-"}
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="font-medium text-sm mb-1">
                            Jawaban Siswa:
                          </p>
                          <p className="text-sm">{ans.jawaban || "-"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 border rounded-lg border-dashed">
                      <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="italic text-muted-foreground">
                        Belum ada jawaban.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="assignment">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Judul Tugas</h3>
                      <p>{data.assignment?.judul}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Deskripsi</h3>
                      <p className="text-sm text-muted-foreground">
                        {data.assignment?.deskripsi || "-"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium">Waktu Mulai</h3>
                        <p className="text-sm">
                          {new Date(data.assignment?.waktuMulai).toLocaleString(
                            "id-ID"
                          )}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium">Waktu Selesai</h3>
                        <p className="text-sm">
                          {new Date(
                            data.assignment?.waktuSelesai
                          ).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Siswa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src="/placeholder.svg"
                    alt={data.student?.nama}
                  />
                  <AvatarFallback>
                    {data.student?.nama?.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{data.student?.nama}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.student?.email}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kelas:</span>
                  <span>
                    {data.assignment?.classSubjectTutor?.class?.namaKelas ||
                      "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mata Pelajaran:</span>
                  <span>
                    {data.assignment?.classSubjectTutor?.subject?.namaMapel ||
                      "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Penilaian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Nilai <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Skor antara 0 sampai 100. Nilai wajib diisi.
                </p>
                <Input
                  type="number"
                  value={nilai}
                  min={0}
                  max={100}
                  onChange={(e) => setNilai(e.target.value)}
                  className={
                    !nilai ? "border-red-300 focus-visible:ring-red-300" : ""
                  }
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Feedback
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Opsional. Berikan komentar atau catatan untuk siswa.
                </p>

                <Textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Masukkan feedback untuk siswa..."
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Menyimpan..." : "Simpan Penilaian"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
