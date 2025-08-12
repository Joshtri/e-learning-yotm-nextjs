"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SkeletonTable from "@/components/ui/skeleton/SkeletonTable";

// Firebase (same flow as create modal)
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditLearningMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [judul, setJudul] = useState("");
  const [konten, setKonten] = useState("");
  const [fileUrl, setFileUrl] = useState(null); // current file url (nullable)
  const [selectedFile, setSelectedFile] = useState(null); // new file (if chosen)

  const [meta, setMeta] = useState({ kelas: "", mapel: "", tutor: "" });

  async function loadDetail() {
    try {
      setLoading(true);
      const res = await api.get(`/tutor/learning-materials/${id}`);
      const m = res.data?.data;
      if (!m) throw new Error("Materi tidak ditemukan");

      setJudul(m.judul || "");
      setKonten(m.konten || "");
      setFileUrl(m.fileUrl || null);
      setMeta({
        kelas: m.classSubjectTutor?.class?.namaKelas || "",
        mapel: m.classSubjectTutor?.subject?.namaMapel || "",
        tutor: m.classSubjectTutor?.tutor?.namaLengkap || "",
      });
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat materi");
      router.push("/tutor/materials");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadDetail();
  }, [id]);

  async function maybeUploadToFirebase(file) {
    const isPDF =
      file?.type === "application/pdf" ||
      file?.name?.toLowerCase().endsWith(".pdf");

    if (!isPDF) throw new Error("Hanya file PDF yang diperbolehkan");
    if (file.size > 3 * 1024 * 1024)
      throw new Error("Ukuran file maksimal 3MB");

    const storageRef = ref(storage, `materials/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  }

  async function handleSave(e) {
    e?.preventDefault();

    try {
      setSaving(true);

      let finalFileUrl;
      if (selectedFile) {
        // upload new file to Firebase
        finalFileUrl = await maybeUploadToFirebase(selectedFile);
      } else {
        // keep current (can be null if removed)
        finalFileUrl = fileUrl ?? null;
      }

      const payload = {
        judul,
        konten,
        fileUrl: finalFileUrl,
      };

      const res = await api.patch(`/tutor/learning-materials/${id}`, payload);
      if (res.data?.success) {
        toast.success("Materi berhasil diperbarui");
        router.push("/tutor/materials");
      } else {
        toast.error(res.data?.message || "Gagal memperbarui materi");
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  }

  function handleRemoveFile() {
    setFileUrl(null); // mark to remove on save
    setSelectedFile(null); // clear any chosen file
    toast.message("Lampiran file akan dihapus saat disimpan");
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Edit Materi"
        description="Ubah informasi materi pembelajaran Anda."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Materi Pembelajaran", href: "/tutor/learning-materials" },
          { label: "Edit" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        }
      />

      {loading ? (
        <SkeletonTable numCols={1} numRows={4} showHeader={false} />
      ) : (
        <form onSubmit={handleSave} className="space-y-4 max-w-3xl">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Kelas</label>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {meta.kelas || "-"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Mata Pelajaran</label>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {meta.mapel || "-"}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Judul</label>
                <Input
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Masukkan judul materi"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Konten</label>
                <Textarea
                  value={konten}
                  onChange={(e) => setKonten(e.target.value)}
                  placeholder="Konten materi (teks)"
                  rows={8}
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Lampiran (PDF, max 3MB)
                </label>

                {fileUrl ? (
                  <div className="flex items-center justify-between rounded border p-2 text-sm">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Lihat file saat ini
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      Hapus Lampiran
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Tidak ada file terlampir
                  </div>
                )}

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Pilih file baru untuk mengganti lampiran. File akan diunggah
                  ke Firebase dan URL-nya disimpan.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
