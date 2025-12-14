"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const QUESTION_TYPES = [
  { label: "Pilihan Ganda", value: "MULTIPLE_CHOICE" },
  { label: "Benar / Salah", value: "TRUE_FALSE" },
  { label: "Essay", value: "ESSAY" },
];

export default function AddQuestionsPage() {
  const router = useRouter();
  const [examInfo, setExamInfo] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const data = sessionStorage.getItem("examInfo");
      if (!data) {
        toast.error("Data ujian tidak ditemukan");
        router.push("/tutor/exams");
      } else {
        setExamInfo(JSON.parse(data));
      }
    }
  }, [isClient, router]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      questions: [
        {
          teks: "",
          image: "", // ✅ Add default image field
          jenis: "MULTIPLE_CHOICE",
          jawabanBenar: "",
          options: [{ teks: "" }, { teks: "" }],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const watchedQuestions = watch("questions");

  const onSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...examInfo,
        questions: formData.questions.map((q) => {
          if (q.jenis === "TRUE_FALSE") {
            return { ...q, options: [{ teks: "Benar" }, { teks: "Salah" }] };
          }
          if (q.jenis === "ESSAY") {
            return { ...q, options: [], jawabanBenar: "" };
          }
          if (q.jenis === "MULTIPLE_CHOICE" && !q.jawabanBenar) {
            return { ...q, jawabanBenar: "0" };
          }
          return q;
        }),
      };

      await api.post("/tutor/exams", payload);

      console.log("SUBMITTING PAYLOAD", payload);

      toast.success("Ujian berhasil dibuat!");
      sessionStorage.removeItem("examInfo");
      router.push("/tutor/exams");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan soal ujian");
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
      image: "", // ✅ Add default image field
      jenis: "MULTIPLE_CHOICE",
      jawabanBenar: "",
      options: [{ teks: "" }, { teks: "" }],
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

  const isQuestionComplete = useCallback(
    (i) => {
      const q = watchedQuestions[i];
      if (!q?.teks) return false;
      if (q.jenis === "MULTIPLE_CHOICE") {
        return (
          q.options.length >= 2 &&
          q.options.every((o) => o.teks?.trim()) &&
          q.jawabanBenar !== ""
        );
      }
      if (q.jenis === "TRUE_FALSE") return q.jawabanBenar !== "";
      if (q.jenis === "ESSAY") return true;
      return false;
    },
    [watchedQuestions]
  );

  const calculateProgress = useCallback(() => {
    if (!watchedQuestions?.length) return 0;
    const complete = watchedQuestions.filter((_, i) =>
      isQuestionComplete(i)
    ).length;
    return (complete / watchedQuestions.length) * 100;
  }, [watchedQuestions, isQuestionComplete]);

  useEffect(() => {
    const type = watchedQuestions[currentQuestionIndex]?.jenis;
    if (type === "TRUE_FALSE") {
      setValue(`questions.${currentQuestionIndex}.options`, [
        { teks: "Benar" },
        { teks: "Salah" },
      ]);
    } else if (type === "ESSAY") {
      setValue(`questions.${currentQuestionIndex}.options`, []);
      setValue(`questions.${currentQuestionIndex}.jawabanBenar`, "");
    }
  }, [watchedQuestions, currentQuestionIndex, setValue]);

  if (!isClient || !examInfo) return null;
  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tambah Soal Ujian: {examInfo?.judul}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {examInfo?.classSubjectTutor?.subject?.namaMapel || ""}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progres Pembuatan Soal</span>
              <span>{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>
      <form id="exam-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daftar Soal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 md:grid-cols-3 gap-2">
                  {fields.map((field, index) => (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`flex items-center justify-center h-10 w-10 rounded-full border ${
                        currentQuestionIndex === index
                          ? "border-primary bg-primary text-primary-foreground"
                          : isQuestionComplete(index)
                          ? "border-green-500 bg-green-100 text-green-700"
                          : "border-gray-300 bg-background"
                      }`}
                      aria-label={`Soal ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={addNewQuestion}
                    className="flex items-center justify-center h-10 w-10 rounded-full border border-dashed border-gray-300 hover:border-gray-400"
                    aria-label="Tambah soal baru"
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
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Menyimpan..." : "Simpan Soal"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Current Question Editor */}
          {fields.length > 0 && currentQuestionIndex < fields.length && (
            <div className="md:col-span-3" key={currentQuestionIndex}>
              <QuestionEditor
                key={`question-${currentQuestionIndex}`}
                control={control}
                currentQuestionIndex={currentQuestionIndex}
                errors={errors}
                watchedQuestions={watchedQuestions}
                removeQuestion={removeQuestion}
                setValue={setValue}
                fields={fields}
                goToNextQuestion={goToNextQuestion}
                goToPreviousQuestion={goToPreviousQuestion}
                addNewQuestion={addNewQuestion}
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

function QuestionEditor({
  control,
  currentQuestionIndex,
  errors,
  watchedQuestions,
  removeQuestion,
  setValue,
  fields,
  goToNextQuestion,
  goToPreviousQuestion,
  addNewQuestion,
}) {
  const {
    fields: optionFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: `questions.${currentQuestionIndex}.options`,
  });

  // ✅ Function to handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // Limit 2MB
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">
            Soal {currentQuestionIndex + 1} dari {fields.length}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeQuestion(currentQuestionIndex)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Hapus Soal
            </Button>
          </div>

          <FormField
            label="Teks Soal"
            name={`questions.${currentQuestionIndex}.teks`}
            type="textarea"
            placeholder="Tuliskan teks soal"
            control={control}
            rules={{ required: "Teks soal wajib diisi" }}
            error={errors?.questions?.[currentQuestionIndex]?.teks?.message}
          />

          {/* 🖼️ Image Upload Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Gambar Soal (Opsional)
            </label>
            <div className="flex flex-col gap-2">
              {watchedQuestions[currentQuestionIndex]?.image ? (
                <div className="relative w-full max-w-sm rounded-md border p-2">
                  <img
                    src={watchedQuestions[currentQuestionIndex].image}
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
            <FormField
              label="Jenis Soal"
              name={`questions.${currentQuestionIndex}.jenis`}
              type="select"
              control={control}
              options={QUESTION_TYPES}
            />

            <FormField
              label="Poin"
              name={`questions.${currentQuestionIndex}.poin`}
              type="number"
              control={control}
              placeholder="Masukkan poin"
              rules={{ required: "Poin wajib diisi" }}
            />
          </div>

          {/* Options Section for Multiple Choice */}
          {watchedQuestions[currentQuestionIndex]?.jenis ===
            "MULTIPLE_CHOICE" && (
            <div className="border rounded-md p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Opsi Jawaban</h3>
              </div>

              {optionFields.map((field, optIndex) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Controller
                    name={`questions.${currentQuestionIndex}.jawabanBenar`}
                    control={control}
                    render={({ field: radioField }) => (
                      <div className="flex items-center h-10">
                        <input
                          type="radio"
                          id={`option-${currentQuestionIndex}-${optIndex}`}
                          value={optIndex.toString()}
                          checked={radioField.value === optIndex.toString()}
                          onChange={() =>
                            radioField.onChange(optIndex.toString())
                          }
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                      </div>
                    )}
                  />
                  <FormField
                    key={`option-field-${currentQuestionIndex}-${optIndex}`}
                    name={`questions.${currentQuestionIndex}.options.${optIndex}.teks`}
                    control={control}
                    placeholder={`Opsi ${optIndex + 1}`}
                    className="flex-1"
                  />
                  {optionFields.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(optIndex)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ teks: "" })}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" /> Tambah Opsi
              </Button>
            </div>
          )}

          {/* TRUE/FALSE Options */}
          {watchedQuestions[currentQuestionIndex]?.jenis === "TRUE_FALSE" && (
            <div className="border rounded-md p-4 space-y-3">
              <h3 className="text-sm font-medium">Pilih Jawaban Benar</h3>
              <div className="flex flex-col gap-2">
                <Controller
                  name={`questions.${currentQuestionIndex}.jawabanBenar`}
                  control={control}
                  render={({ field }) => (
                    <>
                      <label className="flex items-center gap-2 p-3 rounded-md border hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          value="0"
                          checked={field.value === "0"}
                          onChange={() => field.onChange("0")}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span>Benar</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 rounded-md border hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          value="1"
                          checked={field.value === "1"}
                          onChange={() => field.onChange("1")}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span>Salah</span>
                      </label>
                    </>
                  )}
                />
              </div>
            </div>
          )}

          {/* Essay Question Notice */}
          {watchedQuestions[currentQuestionIndex]?.jenis === "ESSAY" && (
            <div className="border rounded-md p-4 space-y-3 bg-blue-50">
              <h3 className="text-sm font-medium text-blue-800">Soal Essay</h3>
              <p className="text-sm text-blue-700">
                Soal essay akan dinilai secara manual oleh tutor. Pastikan untuk
                memberikan instruksi yang jelas.
              </p>
            </div>
          )}
        </div>
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

        <Button type="button" variant="outline" onClick={addNewQuestion}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Soal
        </Button>

        <Button
          type="button"
          onClick={goToNextQuestion}
          disabled={currentQuestionIndex === fields.length - 1}
        >
          Selanjutnya <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
