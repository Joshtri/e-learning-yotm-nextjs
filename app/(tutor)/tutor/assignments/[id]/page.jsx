// /app/(tutor)/tutor/assignments/[id]/questions/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { QuestionType } from "@prisma/client";

export default function AssignmentQuestionPage() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    defaultValues: {
      questions: [
        {
          teks: "",
          jenis: "MULTIPLE_CHOICE",
          poin: 1,
          options: [
            { teks: "", adalahBenar: false },
            { teks: "", adalahBenar: false },
          ],
        },
      ],
    },
  });

  const { register, control, handleSubmit, setValue, watch } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await api.post(`/tutor/assignments/${id}/questions`, {
        questions: data.questions,
      });
      toast.success("Soal berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menyimpan soal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Input Soal Tugas"
        description="Tambahkan soal-soal untuk tugas ini."
        breadcrumbs={[
          { title: "Tugas", href: "/tutor/assignments" },
          { title: "Input Soal", href: `/tutor/assignments/${id}/questions` },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
        {fields.map((field, index) => {
          const jenis = watch(`questions.${index}.jenis`);
          return (
            <Card key={field.id}>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Soal {index + 1}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Jenis Soal</Label>
                  <select
                    {...register(`questions.${index}.jenis`)}
                    className="w-full border px-2 py-1 rounded"
                  >
                    <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                    <option value="ESSAY">Essay</option>
                  </select>
                </div>

                <div>
                  <Label>Pertanyaan</Label>
                  <Textarea {...register(`questions.${index}.teks`)} />
                </div>

                <div>
                  <Label>Poin</Label>
                  <Input
                    type="number"
                    {...register(`questions.${index}.poin`)}
                    min={1}
                  />
                </div>

                {jenis === "MULTIPLE_CHOICE" && (
                  <div className="space-y-2">
                    <Label>Opsi Jawaban</Label>
                    {[0, 1, 2, 3].map((optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <Input
                          placeholder={`Opsi ${optIdx + 1}`}
                          {...register(
                            `questions.${index}.options.${optIdx}.teks`
                          )}
                        />
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            {...register(
                              `questions.${index}.options.${optIdx}.adalahBenar`
                            )}
                          />
                          Benar
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              teks: "",
              jenis: "MULTIPLE_CHOICE",
              poin: 1,
              options: [
                { teks: "", adalahBenar: false },
                { teks: "", adalahBenar: false },
              ],
            })
          }
        >
          <Plus className="w-4 h-4 mr-1" />
          Tambah Soal
        </Button>

        <div className="pt-4">
          <Button type="submit" disabled={isLoading}>
            Simpan Semua Soal
          </Button>
        </div>
      </form>
    </div>
  );
}
