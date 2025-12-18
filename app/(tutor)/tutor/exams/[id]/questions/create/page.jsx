"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

const QUESTION_TYPES = [
  { label: "Pilihan Ganda", value: "MULTIPLE_CHOICE" },
  { label: "Benar / Salah", value: "TRUE_FALSE" },
  { label: "Essay", value: "ESSAY" },
];

export default function AddQuestionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const watchedQuestions = watch("questions");

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await api.post(`/tutor/exams/${id}/questions`, data);
      toast.success("Soal berhasil disimpan");
      router.push(`/tutor/exams/${id}`);
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || "Gagal menyimpan soal";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < fields.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const addNewQuestion = () => {
    append({
      teks: "",
      jenis: "MULTIPLE_CHOICE",
      options: [
        { teks: "", adalahBenar: false },
        { teks: "", adalahBenar: false },
      ],
    });
    setTimeout(() => {
      setCurrentQuestionIndex(fields.length);
    }, 50);
  };

  const removeQuestion = (index) => {
    if (fields.length > 1) {
      remove(index);
      if (index <= currentQuestionIndex && currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      }
    } else {
      toast.error("Minimal harus ada 1 soal");
    }
  };

  const calculateProgress = useCallback(() => {
    if (!watchedQuestions || watchedQuestions.length === 0) return 0;
    const completedCount = watchedQuestions.filter((q) => {
      if (!q.teks) return false;
      if (q.jenis === "ESSAY") return true;
      if (q.jenis === "MULTIPLE_CHOICE" || q.jenis === "TRUE_FALSE") {
        return (
          q.options?.length >= 2 &&
          q.options.every((opt) => opt.teks) &&
          q.options.some((opt) => opt.adalahBenar)
        );
      }
      return false;
    }).length;
    return (completedCount / watchedQuestions.length) * 100;
  }, [watchedQuestions]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran gambar maksimal 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue(`questions.${currentQuestionIndex}.image`, reader.result, {
          shouldDirty: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setValue(`questions.${currentQuestionIndex}.image`, "", {
      shouldDirty: true,
    });
  };

  // Validasi apakah semua soal sudah terisi dengan benar
  const isFormValid = () => {
    return watchedQuestions.every((q) => {
      if (!q.teks) return false;
      if (q.jenis === "ESSAY") return true;
      if (q.jenis === "MULTIPLE_CHOICE" || q.jenis === "TRUE_FALSE") {
        return (
          q.options?.length >= 2 &&
          q.options.every((opt) => opt.teks) &&
          q.options.some((opt) => opt.adalahBenar)
        );
      }
      return false;
    });
  };

  const getConfirmationMessage = () => {
    const totalQuestions = watchedQuestions.length;
    const completedQuestions = watchedQuestions.filter((q) => {
      if (!q.teks) return false;
      if (q.jenis === "ESSAY") return true;
      if (q.jenis === "MULTIPLE_CHOICE" || q.jenis === "TRUE_FALSE") {
        return (
          q.options?.length >= 2 &&
          q.options.every((opt) => opt.teks) &&
          q.options.some((opt) => opt.adalahBenar)
        );
      }
      return false;
    }).length;

    return `Anda akan menyimpan ${totalQuestions} soal ujian. ${completedQuestions} soal sudah lengkap dan ${
      totalQuestions - completedQuestions
    } soal belum lengkap. Apakah Anda yakin ingin menyimpan?`;
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tambah Soal Ujian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
          <div className="text-sm text-muted-foreground">
            {watchedQuestions.length} soal dibuat •{" "}
            {Math.round(calculateProgress())}% selesai
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Soal */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daftar Soal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 md:grid-cols-3 gap-2">
                  {fields.map((field, index) => {
                    const question = watchedQuestions[index];
                    const isComplete =
                      question?.teks &&
                      (question.jenis === "ESSAY" ||
                        (question.options?.length >= 2 &&
                          question.options.every((opt) => opt.teks) &&
                          question.options.some((opt) => opt.adalahBenar)));

                    return (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`flex items-center justify-center h-10 w-10 rounded-full border ${
                          currentQuestionIndex === index
                            ? "border-primary bg-primary text-primary-foreground"
                            : isComplete
                            ? "border-green-500 bg-green-100 text-green-700"
                            : "border-gray-300 bg-background"
                        }`}
                        aria-label={`Soal ${index + 1}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={addNewQuestion}
                    className="flex items-center justify-center h-10 w-10 rounded-full border border-dashed hover:border-gray-400"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-3 w-3 rounded-full bg-green-100 border border-green-500"></div>
                    <span>Soal lengkap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-background border border-gray-300"></div>
                    <span>Soal belum lengkap</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <ConfirmationDialog
                  title="Konfirmasi Simpan Soal"
                  description={getConfirmationMessage()}
                  confirmText="Ya, simpan"
                  cancelText="Batal"
                  loading={isSubmitting}
                  onConfirm={handleSubmit(onSubmit)}
                  trigger={
                    <Button
                      type="button"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={isSubmitting || watchedQuestions.length === 0}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Menyimpan..." : "Simpan Semua Soal"}
                    </Button>
                  }
                />
              </CardFooter>
            </Card>
          </div>

          {/* Form Edit Soal */}
          {fields.length > 0 && (
            <div className="md:col-span-3" key={currentQuestionIndex}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                      Soal {currentQuestionIndex + 1} dari {fields.length}
                    </CardTitle>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(currentQuestionIndex)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Hapus
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Teks Soal</Label>
                    <Textarea
                      {...register(`questions.${currentQuestionIndex}.teks`, {
                        required: "Teks soal wajib diisi",
                      })}
                      placeholder="Tulis pertanyaan di sini"
                    />
                    {errors.questions?.[currentQuestionIndex]?.teks && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.questions[currentQuestionIndex].teks.message}
                      </p>
                    )}
                  </div>

                  {/* 🖼️ Image Upload Section */}
                  <div className="space-y-2">
                    <Label>Gambar Soal (Opsional)</Label>
                    <div className="flex flex-col gap-2">
                      {watch(`questions.${currentQuestionIndex}.image`) ? (
                        <div className="relative w-full max-w-sm rounded-md border p-2">
                          <img
                            src={watch(
                              `questions.${currentQuestionIndex}.image`
                            )}
                            alt="Preview Soal"
                            className="w-full h-auto rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={removeImage}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Jenis Soal</Label>
                      <Select
                        value={watch(`questions.${currentQuestionIndex}.jenis`)}
                        onValueChange={(val) => {
                          setValue(
                            `questions.${currentQuestionIndex}.jenis`,
                            val
                          );
                          // Reset options when changing question type
                          if (val === "ESSAY") {
                            setValue(
                              `questions.${currentQuestionIndex}.options`,
                              []
                            );
                          } else if (val === "TRUE_FALSE") {
                            setValue(
                              `questions.${currentQuestionIndex}.options`,
                              [
                                { teks: "Benar", adalahBenar: false },
                                { teks: "Salah", adalahBenar: false },
                              ]
                            );
                          } else {
                            setValue(
                              `questions.${currentQuestionIndex}.options`,
                              [
                                { teks: "", adalahBenar: false },
                                { teks: "", adalahBenar: false },
                              ]
                            );
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis soal" />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Poin</Label>
                      <Input disabled placeholder="(Otomatis)" />
                    </div>
                  </div>

                  {/* Kalau pilihan ganda atau true/false */}
                  {(watch(`questions.${currentQuestionIndex}.jenis`) ===
                    "MULTIPLE_CHOICE" ||
                    watch(`questions.${currentQuestionIndex}.jenis`) ===
                      "TRUE_FALSE") && (
                    <div className="border rounded-md p-4 space-y-2">
                      <Label>Opsi Jawaban</Label>
                      {watch(`questions.${currentQuestionIndex}.options`)?.map(
                        (opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <Controller
                              control={control}
                              name={`questions.${currentQuestionIndex}.options.${optIdx}.adalahBenar`}
                              render={({ field }) => (
                                <input
                                  type="radio"
                                  value={optIdx}
                                  checked={field.value}
                                  onChange={() => {
                                    setValue(
                                      `questions.${currentQuestionIndex}.options`,
                                      watch(
                                        `questions.${currentQuestionIndex}.options`
                                      ).map((o, i) => ({
                                        ...o,
                                        adalahBenar: i === optIdx,
                                      }))
                                    );
                                  }}
                                />
                              )}
                            />
                            <Input
                              {...register(
                                `questions.${currentQuestionIndex}.options.${optIdx}.teks`,
                                { required: "Opsi jawaban wajib diisi" }
                              )}
                              placeholder={`Opsi ${optIdx + 1}`}
                              className="flex-1"
                              disabled={
                                watch(
                                  `questions.${currentQuestionIndex}.jenis`
                                ) === "TRUE_FALSE"
                              }
                            />
                            {watch(
                              `questions.${currentQuestionIndex}.jenis`
                            ) === "MULTIPLE_CHOICE" &&
                              watch(`questions.${currentQuestionIndex}.options`)
                                .length > 2 && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    const updatedOptions = [
                                      ...watch(
                                        `questions.${currentQuestionIndex}.options`
                                      ),
                                    ];
                                    updatedOptions.splice(optIdx, 1);
                                    setValue(
                                      `questions.${currentQuestionIndex}.options`,
                                      updatedOptions
                                    );
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                          </div>
                        )
                      )}
                      {watch(`questions.${currentQuestionIndex}.jenis`) ===
                        "MULTIPLE_CHOICE" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setValue(
                              `questions.${currentQuestionIndex}.options`,
                              [
                                ...watch(
                                  `questions.${currentQuestionIndex}.options`
                                ),
                                { teks: "", adalahBenar: false },
                              ]
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-1" /> Tambah Opsi
                        </Button>
                      )}

                      {/* Warning jika belum ada jawaban benar */}
                      {watch(`questions.${currentQuestionIndex}.options`) &&
                        !watch(
                          `questions.${currentQuestionIndex}.options`
                        ).some((opt) => opt.adalahBenar) && (
                          <p className="text-sm text-amber-600">
                            ⚠️ Pilih salah satu opsi sebagai jawaban benar
                          </p>
                        )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addNewQuestion}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Tambah Soal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToNextQuestion}
                    disabled={currentQuestionIndex === fields.length - 1}
                  >
                    Selanjutnya <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
