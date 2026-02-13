"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export default function AssignmentEditPage() {
  const [classOptions, setClassOptions] = useState([]);
  const [questionFile, setQuestionFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id;

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm();

  const fetchAssignmentData = useCallback(async () => {
    try {
      setIsFetching(true);
      const res = await api.get(`/tutor/assignments/${assignmentId}`);
      const assignment = res.data.data;

      // Set form values with existing data
      setValue("judul", assignment.judul);
      setValue("deskripsi", assignment.deskripsi || "");
      setValue("classSubjectTutorId", assignment.classSubjectTutorId);
      setValue("nilaiMaksimal", assignment.nilaiMaksimal || 100);
      setValue("jenis", assignment.jenis || "EXERCISE");

      // Format dates to yyyy-MM-dd for input[type="date"]
      if (assignment.TanggalMulai) {
        setValue(
          "tanggalMulai",
          format(new Date(assignment.TanggalMulai), "yyyy-MM-dd"),
        );
      }
      if (assignment.TanggalSelesai) {
        setValue(
          "tanggalSelesai",
          format(new Date(assignment.TanggalSelesai), "yyyy-MM-dd"),
        );
      }
    } catch {
      toast.error("Gagal memuat data tugas");
      router.push("/tutor/assignments");
    } finally {
      setIsFetching(false);
    }
  }, [assignmentId, setValue, router]);

  const fetchClassOptions = async () => {
    try {
      const res = await api.get("/tutor/my-classes");
      const all = res.data.data || [];
      const filtered = all.filter(
        (item) =>
          item?.class?.academicYear?.isActive === true &&
          item?.class &&
          item?.subject,
      );
      setClassOptions(filtered);
    } catch {
      toast.error("Gagal memuat kelas Anda");
    }
  };

  useEffect(() => {
    fetchClassOptions();
    fetchAssignmentData();
  }, [fetchAssignmentData]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Convert PDF to base64 if file is selected
      let questionsFromPdf = null;
      if (questionFile) {
        const base64 = await convertFileToBase64(questionFile);
        questionsFromPdf = base64;
      }

      await api.patch(`/tutor/assignments/${assignmentId}`, {
        judul: data.judul,
        deskripsi: data.deskripsi,
        classSubjectTutorId: data.classSubjectTutorId,
        tanggalMulai: data.tanggalMulai,
        tanggalSelesai: data.tanggalSelesai,
        jenis: data.jenis || "EXERCISE",
        nilaiMaksimal: Number(data.nilaiMaksimal) || 100,
        ...(questionsFromPdf && { questionsFromPdf }),
      });

      toast.success("Tugas berhasil diperbarui");
      router.push("/tutor/assignments");
    } catch {
      toast.error("Gagal memperbarui tugas");
    } finally {
      setIsLoading(false);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setQuestionFile(file);
    } else {
      toast.error("Hanya file PDF yang diperbolehkan");
      e.target.value = "";
    }
  };

  if (isFetching) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
        <div className="text-center">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="p-8 mx-auto  min-h-screen">
      <PageHeader
        title="Edit Tugas"
        description="Perbarui informasi tugas yang telah dibuat."
        breadcrumbs={[
          { label: "Tugas", href: "/tutor/assignments" },
          { label: "Edit Tugas" },
        ]}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 bg-white shadow-md rounded-lg p-6 space-y-6"
      >
        {/* Judul */}
        <div>
          <Label className="text-gray-700 font-medium">
            Judul <span className="text-red-500">*</span>
          </Label>
          <Input
            {...register("judul", { required: "Judul wajib diisi" })}
            className={`mt-1 border ${
              errors.judul ? "border-red-500" : "border-gray-300"
            } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
            placeholder="Masukkan judul tugas"
          />
          {errors.judul && (
            <p className="mt-1 text-sm text-red-500">{errors.judul.message}</p>
          )}
        </div>

        {/* Deskripsi */}
        <div>
          <Label className="text-gray-700 font-medium">Deskripsi</Label>
          <Textarea
            {...register("deskripsi")}
            className="mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="Masukkan deskripsi tugas (opsional)"
            rows={4}
          />
        </div>

        {/* Kelas dan Mapel */}
        <div>
          <Label className="text-gray-700 font-medium">
            Kelas dan Mapel <span className="text-red-500">*</span>
          </Label>
          <Select
            value={getValues("classSubjectTutorId")}
            onValueChange={(val) =>
              setValue("classSubjectTutorId", val, { shouldValidate: true })
            }
          >
            <SelectTrigger
              className={`mt-1 border ${
                errors.classSubjectTutorId
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
            >
              <SelectValue placeholder="Pilih kelas & mapel" />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.class?.namaKelas || "Kelas"} -{" "}
                  {item.subject?.namaMapel || "Mapel"} (
                  {item.class?.academicYear?.tahunMulai}/
                  {item.class?.academicYear?.tahunSelesai})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="hidden"
            {...register("classSubjectTutorId", {
              required: "Kelas dan Mapel wajib dipilih",
            })}
          />
          {errors.classSubjectTutorId && (
            <p className="mt-1 text-sm text-red-500">
              {errors.classSubjectTutorId.message}
            </p>
          )}
        </div>

        {/* Jenis Tugas */}
        <div>
          <Label className="text-gray-700 font-medium">
            Jenis Tugas <span className="text-red-500">*</span>
          </Label>
          <Select
            value={getValues("jenis")}
            onValueChange={(val) =>
              setValue("jenis", val, { shouldValidate: true })
            }
          >
            <SelectTrigger className="mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
              <SelectValue placeholder="Pilih jenis tugas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MATERIAL">Material</SelectItem>
              <SelectItem value="EXERCISE">Exercise</SelectItem>
              <SelectItem value="QUIZ">Quiz</SelectItem>
              <SelectItem value="DAILY_TEST">Ujian Harian</SelectItem>
              <SelectItem value="START_SEMESTER_TEST">
                Ujian Awal Semester
              </SelectItem>
              <SelectItem value="MIDTERM">UTS</SelectItem>
              <SelectItem value="FINAL_EXAM">UAS</SelectItem>
            </SelectContent>
          </Select>
          <input
            type="hidden"
            {...register("jenis", { required: "Jenis tugas wajib dipilih" })}
          />
        </div>

        {/* Nilai Maksimal */}
        <div>
          <Label className="text-gray-700 font-medium">Nilai Maksimal</Label>
          <Input
            type="number"
            {...register("nilaiMaksimal")}
            className="mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="100"
            min="1"
          />
        </div>

        {/* Tanggal Mulai dan Selesai */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-gray-700 font-medium">
              Tanggal Mulai <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              {...register("tanggalMulai", {
                required: "Tanggal mulai wajib diisi",
                validate: {
                  beforeEndDate: (value) => {
                    const endDate = getValues("tanggalSelesai");
                    if (!endDate) return true;
                    return (
                      new Date(value) <= new Date(endDate) ||
                      "Tanggal mulai harus sama dengan atau sebelum tanggal selesai"
                    );
                  },
                },
              })}
              className={`mt-1 border ${
                errors.tanggalMulai ? "border-red-500" : "border-gray-300"
              } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
            />
            {errors.tanggalMulai && (
              <p className="mt-1 text-sm text-red-500">
                {errors.tanggalMulai.message}
              </p>
            )}
          </div>
          <div>
            <Label className="text-gray-700 font-medium">
              Tanggal Selesai <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              {...register("tanggalSelesai", {
                required: "Tanggal selesai wajib diisi",
                validate: {
                  afterStartDate: (value) => {
                    const startDate = getValues("tanggalMulai");
                    if (!startDate) return true;
                    return (
                      new Date(value) >= new Date(startDate) ||
                      "Tanggal selesai harus sama dengan atau setelah tanggal mulai"
                    );
                  },
                },
              })}
              className={`mt-1 border ${
                errors.tanggalSelesai ? "border-red-500" : "border-gray-300"
              } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
            />
            {errors.tanggalSelesai && (
              <p className="mt-1 text-sm text-red-500">
                {errors.tanggalSelesai.message}
              </p>
            )}
          </div>
        </div>

        {/* Questions PDF Upload */}
        <div>
          <Label className="text-gray-700 font-medium">
            Upload Soal Baru (PDF) - Opsional
          </Label>
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <p className="mt-1 text-xs text-gray-500">
            Upload file PDF baru jika ingin mengganti soal. Jika tidak, soal
            lama akan tetap digunakan.
          </p>
          {questionFile && (
            <p className="mt-1 text-sm text-green-600">
              File terpilih: {questionFile.name}
            </p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/tutor/assignments")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-md transition-all"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-md transition-all"
          >
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
