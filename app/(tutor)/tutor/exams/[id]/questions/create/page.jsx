"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function AddQuestionsPage() {
  const { id } = useParams();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      questions: [
        {
          teks: "",
          jenis: "MULTIPLE_CHOICE",

          options: [
            { teks: "", adalahBenar: false },
            { teks: "", adalahBenar: false },
          ],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const onSubmit = async (data) => {
    try {
      await api.post(`/tutor/exams/${id}/questions`, data);
      toast.success("Soal berhasil disimpan");
      router.push(`/tutor/exams/${id}`);
    } catch (error) {
      toast.error("Gagal menyimpan soal");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Tambah Soal</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => {
          const jenis = watch(`questions.${index}.jenis`);

          return (
            <Card key={field.id} className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">
                  Soal #{index + 1}
                </Label>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    Hapus
                  </Button>
                )}
              </div>

              <div>
                <Label>Jenis Soal</Label>
                <Select
                  defaultValue={jenis}
                  onValueChange={(val) =>
                    setValue(`questions.${index}.jenis`, val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis soal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MULTIPLE_CHOICE">
                      Pilihan Ganda
                    </SelectItem>
                    <SelectItem value="TRUE_FALSE">Benar / Salah</SelectItem>
                    <SelectItem value="ESSAY">Essay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Pertanyaan</Label>
                <Textarea
                  {...register(`questions.${index}.teks`, { required: true })}
                />
              </div>

              {/* ✅ Untuk soal ESSAY, beri info bahwa poin bisa diisi saat koreksi */}
              {jenis === "ESSAY" && (
                <p className="text-sm text-muted-foreground italic">
                  Poin untuk soal essay akan diberikan secara manual saat
                  koreksi.
                </p>
              )}

              {(jenis === "MULTIPLE_CHOICE" || jenis === "TRUE_FALSE") && (
                <div className="grid grid-cols-2 gap-4">
                  {watch(`questions.${index}.options`).map((_, optIdx) => (
                    <div key={optIdx}>
                      <Label>Opsi {String.fromCharCode(65 + optIdx)}</Label>
                      <Input
                        {...register(
                          `questions.${index}.options.${optIdx}.teks`,
                          {
                            required: true,
                          }
                        )}
                      />
                      <label className="flex items-center gap-2 text-sm mt-1">
                        <input
                          type="radio"
                          name={`questions.${index}.jawabanBenar`}
                          value={optIdx}
                          onChange={() =>
                            setValue(
                              `questions.${index}.options`,
                              watch(`questions.${index}.options`).map(
                                (o, i) => ({
                                  ...o,
                                  adalahBenar: i === optIdx,
                                })
                              )
                            ) ||
                            setValue(
                              `questions.${index}.jawabanBenar`,
                              String(optIdx)
                            )
                          }
                          checked={
                            watch(
                              `questions.${index}.options.${optIdx}.adalahBenar`
                            ) || false
                          }
                        />
                        Jawaban Benar
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {jenis !== "ESSAY" && (
                <div>
                  <Label>Poin</Label>
                  <Input type="number" value="(otomatis)" disabled />
                </div>
              )}

              {/* Essay tidak butuh opsi */}
              {jenis === "ESSAY" && (
                <p className="text-muted-foreground italic text-sm">
                  Soal Essay tidak memiliki opsi jawaban dan tidak akan dinilai
                  otomatis.
                </p>
              )}
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

              options: [
                { teks: "", adalahBenar: false },
                { teks: "", adalahBenar: false },
              ],
            })
          }
        >
          + Tambah Soal
        </Button>

        <div className="pt-6">
          <Button type="submit">Simpan Semua Soal</Button>
        </div>
      </form>
    </div>
  );
}
