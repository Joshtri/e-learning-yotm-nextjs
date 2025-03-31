import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";

export default async function LearningMaterialDetailPage({ params }) {
  const { id } = params;

  let material = null;

  try {
    const res = await api.get(`/learning-materials/${id}`);
    material = res.data.data;
  } catch (error) {
    console.error("Gagal fetch detail materi:", error);
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">{material.judul}</h1>
        <p className="text-sm text-muted-foreground">
          Dibuat: {new Date(material.createdAt).toLocaleDateString("id-ID")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Badge>Kelas: {material.classSubjectTutor?.class?.namaKelas}</Badge>
        <Badge>Mapel: {material.classSubjectTutor?.subject?.namaMapel}</Badge>
        <Badge>Tutor: {material.classSubjectTutor?.tutor?.namaLengkap}</Badge>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold text-lg">Konten Materi:</h2>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: material.konten }}
        />
      </div>

      {material.fileUrl && (
        <div>
          <h2 className="font-semibold text-lg mt-6">File Utama:</h2>
          <a
            href={material.fileUrl}
            target="_blank"
            className="text-blue-600 underline"
          >
            Lihat File
          </a>
        </div>
      )}

      {material.attachments.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mt-6">Lampiran Tambahan:</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {material.attachments.map((att) => (
              <li key={att.id}>
                <a
                  href={att.fileUrl}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  {att.namaFile} ({Math.round(att.ukuranFile / 1024)} KB)
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
