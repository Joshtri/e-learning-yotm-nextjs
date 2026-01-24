"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSubjectById, updateSubject } from "@/services/SubjectService";
import api from "@/lib/axios";

export default function SubjectEditPage() {
  const { id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    namaMapel: "",
    kodeMapel: "",
    deskripsi: "",
    programId: "",
  });

  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [subjectRes, programsRes] = await Promise.all([
          getSubjectById(id),
          api.get("/programs?limit=0"),
        ]);

        if (subjectRes.success) {
          setFormData({
            namaMapel: subjectRes.data.namaMapel || "",
            kodeMapel: subjectRes.data.kodeMapel || "",
            deskripsi: subjectRes.data.deskripsi || "",
            programId: subjectRes.data.programId || "",
          });
        } else {
          toast.error("Data tidak ditemukan");
          router.push("/admin/subject");
        }

        if (programsRes.data.success) {
          setPrograms(programsRes.data.data.programs || []);
        }
      } catch {
        toast.error("Gagal mengambil data");
        router.push("/admin/subject");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        programId: formData.programId || null,
      };

      const res = await updateSubject(id, payload);
      if (res.success) {
        toast.success("Mata pelajaran berhasil diperbarui");
        router.push("/admin/subject");
      } else {
        toast.error(res.message || "Gagal memperbarui");
      }
    } catch {
      toast.error("Terjadi kesalahan saat update");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6 space-y-6">
          <PageHeader
            title="Edit Mata Pelajaran"
            description="Ubah data mata pelajaran yang terdaftar"
            breadcrumbs={[
              { label: "Mata Pelajaran", href: "/admin/subject" },
              { label: "Edit Mata Pelajaran" },
            ]}
          />

          {!isLoading && (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium">Nama Mapel</label>
                <Input
                  name="namaMapel"
                  value={formData.namaMapel}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Paket/Program (opsional)
                </label>
                <select
                  name="programId"
                  value={formData.programId}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- Pilih Program --</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.namaPaket}
                    </option>
                  ))}
                </select>
              </div>

              {/* <div>
                <label className="block text-sm font-medium">Kode Mapel</label>
                <Input
                  name="kodeMapel"
                  value={formData.kodeMapel}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Deskripsi</label>
                <Textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleChange}
                  rows={4}
                />
              </div> */}

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/subject")}
                >
                  Batal
                </Button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
