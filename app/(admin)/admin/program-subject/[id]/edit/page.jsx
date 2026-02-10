"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";

export default function EditProgramSubjectPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    programId: "",
    subjectId: "",
  });

  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [programRes, subjectRes, detailRes] = await Promise.all([
        api.get("/programs"),
        api.get("/subjects"),
        api.get(`/program-subjects/${id}`),
      ]);

      const item = detailRes.data.data;
      const subjectsList = subjectRes.data.data.subjects || [];

      setPrograms(programRes.data.data.programs || []);
      setSubjects(subjectsList);

      // Set form after subjects are loaded
      setForm({
        programId: item.programId ?? item.program?.id ?? "",
        subjectId: item.subjectId ?? item.subject?.id ?? "",
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Gagal memuat data");
      router.push("/admin/program-subject");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleChange = (key, value) => {
    if (key === "programId") {
      // Reset subjectId when program changes
      setForm((prev) => ({ ...prev, programId: value, subjectId: "" }));
    } else {
      setForm((prev) => ({ ...prev, [key]: value }));
    }
  };

  // Filter subjects by selected program (include general subjects without programId)
  const filteredSubjects = form.programId
    ? subjects.filter((s) => !s.programId || s.programId === form.programId)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.put(`/program-subjects/${id}`, form);
      toast.success("Berhasil memperbarui data");
      router.push("/admin/program-subject");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memperbarui");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6 space-y-6 max-w-xl mx-auto">
          <PageHeader
            title="Edit Mapel Program"
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Program Mapel", href: "/admin/program-subject" },
              { label: "Edit" },
            ]}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Program</label>
              <Select
                value={form.programId}
                onValueChange={(val) => handleChange("programId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.namaPaket}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Mata Pelajaran</label>
              <Select
                value={form.subjectId}
                onValueChange={(val) => handleChange("subjectId", val)}
                disabled={!form.programId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      form.programId
                        ? "Pilih mata pelajaran"
                        : "Pilih program terlebih dahulu"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.namaMapel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/program-subject")}
              >
                Batal
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
