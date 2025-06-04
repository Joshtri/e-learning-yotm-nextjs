"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm, useFieldArray } from "react-hook-form";
import { LoadingSpinner } from "@/components/ui/loading/loading-spinner";

export default function AssignmentQuestionsPage() {
  const { id } = useParams(); // assignmentId
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      questions: [{ teks: "", jenis: "ESSAY", poin: 10, pembahasan: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await api.get(`/tutor/assignments/${id}`);
        setAssignment(res.data.data);
      } catch {
        toast.error("Gagal memuat tugas");
      }
    };
    fetchAssignment();
  }, [id]);

  const onSubmit = async (data) => {
    try {
      await api.post(`/tutor/assignments/${id}/questions`, {
        questions: data.questions,
      });
      toast.success("Soal berhasil disimpan");
      router.push("/tutor/assignments");
    } catch {
      toast.error("Gagal menyimpan soal");
    }
  };

  if (!assignment) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-background min-h-screen">
      <PageHeader
        title={`Input Soal: ${assignment.judul}`}
        description={`${assignment.classSubjectTutor.class.namaKelas} - ${assignment.classSubjectTutor.subject.namaMapel}`}
        breadcrumbs={[
          { label: "Tugas", href: "/tutor/assignments" },
          { label: "Input Soal", href: `/tutor/assignments/${id}/questions` },
        ]}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 bg-card shadow-sm rounded-lg p-6 space-y-6"
      >
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border border-input rounded-md p-5 space-y-4 bg-background"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">
                Soal {index + 1}
              </h3>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1"
                >
                  Hapus
                </Button>
              )}
            </div>

            <div>
              <Label className="text-foreground font-medium">
                Soal <span className="text-red-500">*</span>
              </Label>
              <Textarea
                {...register(`questions.${index}.teks`, {
                  required: "Soal wajib diisi",
                })}
                className={`mt-1 border ${
                  errors.questions?.[index]?.teks
                    ? "border-red-500"
                    : "border-input"
                } rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all bg-input text-foreground placeholder-muted-foreground h-24`}
                placeholder="Masukkan soal di sini..."
              />
              {errors.questions?.[index]?.teks && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.questions[index].teks.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground font-medium">Jenis Soal</Label>
                <Input
                  disabled
                  value="ESSAY"
                  {...register(`questions.${index}.jenis`)}
                  className="mt-1 border border-input rounded-md bg-input text-foreground opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <Label className="text-foreground font-medium">
                  Poin <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  {...register(`questions.${index}.poin`, {
                    required: "Poin wajib diisi",
                    min: { value: 1, message: "Poin minimal 1" },
                  })}
                  className={`mt-1 border ${
                    errors.questions?.[index]?.poin
                      ? "border-red-500"
                      : "border-input"
                  } rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all bg-input text-foreground placeholder-muted-foreground`}
                  placeholder="Contoh: 10"
                />
                {errors.questions?.[index]?.poin && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.questions[index].poin.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-foreground font-medium">
                Pembahasan (opsional)
              </Label>
              <Textarea
                {...register(`questions.${index}.pembahasan`)}
                className="mt-1 border border-input rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all bg-input text-foreground placeholder-muted-foreground h-20"
                placeholder="Masukkan pembahasan di sini..."
              />
            </div>
          </div>
        ))}

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({ teks: "", jenis: "ESSAY", poin: 10, pembahasan: "" })
            }
            className="border border-blue-400 text-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-all px-4 py-2"
          >
            + Tambah Soal
          </Button>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Semua Soal"}
          </Button>
        </div>
      </form>
    </div>
  );
}