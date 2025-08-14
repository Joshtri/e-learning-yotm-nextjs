"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

function linkifyText(text) {
  if (!text) return "";

  // Regex untuk mendeteksi URL
  const urlRegex = /(\bhttps?:\/\/[^\s<]+)/gi;

  // Ganti URL dengan anchor tag
  return text.replace(
    urlRegex,
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${url}</a>`
  );
}

export default function LearningMaterialDetailPage() {
  const { id } = useParams();
  const [material, setMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMaterial = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/learning-materials/${id}`);
      setMaterial(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data materi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchMaterial();
  }, [id]);

  return (
    <main className="p-6 space-y-6">
      <PageHeader
        title={material?.judul || "Detail Materi"}
        description="Informasi lengkap tentang materi pembelajaran"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Materi", href: "/admin/learning-materials" },
          { label: material?.judul || "..." },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Informasi Umum</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p>
            <b>Kelas:</b> {material?.classSubjectTutor?.class?.namaKelas}
          </p>
          <p>
            <b>Mapel:</b> {material?.classSubjectTutor?.subject?.namaMapel}
          </p>
          <p>
            <b>Tutor:</b> {material?.classSubjectTutor?.tutor?.namaLengkap}
          </p>
          <p>
            <b>Dibuat:</b>{" "}
            {new Date(material?.createdAt).toLocaleString("id-ID")}
          </p>
          <p>
            <b>Terakhir Diperbarui:</b>{" "}
            {new Date(material?.updatedAt).toLocaleString("id-ID")}
          </p>
          {material?.fileUrl && (
            <p>
              <b>File:</b>{" "}
              <a
                href={material.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Lihat File
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konten Materi</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: linkifyText(material?.konten || "") }} />
        </CardContent>
      </Card>
    </main>
  );
}
