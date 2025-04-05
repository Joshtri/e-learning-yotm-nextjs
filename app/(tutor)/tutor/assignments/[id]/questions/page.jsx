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

export default function AssignmentQuestionsPage() {
  const { id } = useParams(); // assignmentId
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
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

  if (!assignment) return <div className="p-6">Memuat...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Input Soal: ${assignment.judul}`}
        description={`${assignment.classSubjectTutor.class.namaKelas} - ${assignment.classSubjectTutor.subject.namaMapel}`}
        breadcrumbs={[
          { title: "Tugas", href: "/tutor/assignments" },
          { title: "Input Soal", href: `/tutor/assignments/${id}/questions` },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
        {fields.map((field, index) => (
          <div key={field.id} className="border p-4 rounded-md space-y-2">
            <div>
              <Label>Soal</Label>
              <Textarea
                {...register(`questions.${index}.teks`, { required: true })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jenis Soal</Label>
                <Input
                  disabled
                  value="ESSAY"
                  {...register(`questions.${index}.jenis`)}
                />
              </div>
              <div>
                <Label>Poin</Label>
                <Input
                  type="number"
                  {...register(`questions.${index}.poin`, { required: true })}
                />
              </div>
            </div>
            <div>
              <Label>Pembahasan (opsional)</Label>
              <Textarea {...register(`questions.${index}.pembahasan`)} />
            </div>
            <div className="text-right">
              <Button
                type="button"
                variant="destructive"
                onClick={() => remove(index)}
              >
                Hapus Soal
              </Button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ teks: "", jenis: "ESSAY", poin: 10, pembahasan: "" })
          }
        >
          + Tambah Soal
        </Button>

        <div className="pt-4">
          <Button type="submit" disabled={isSubmitting}>
            Simpan Semua Soal
          </Button>
        </div>
      </form>
    </div>
  );
}
