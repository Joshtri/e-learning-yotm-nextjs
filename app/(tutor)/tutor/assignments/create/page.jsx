"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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

export default function AssignmentCreatePage() {
  const [classOptions, setClassOptions] = useState([]);
  const [questionFile, setQuestionFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      tanggalMulai: format(new Date(), "yyyy-MM-dd"),
      tanggalSelesai: format(new Date(), "yyyy-MM-dd"),
    },
  });


  const fetchClassOptions = async () => {
    try {
      const res = await api.get("/tutor/my-classes");
      const all = res.data.data || [];
      const filtered = all.filter(
        (item) => item.class.academicYear?.isActive === true
      );
      setClassOptions(filtered);
    } catch {
      toast.error("Gagal memuat kelas Anda");
    }
  };

  useEffect(() => {
    fetchClassOptions();
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Convert PDF to base64 if file is selected
      let questionsFromPdf = null;
      if (questionFile) {
        const base64 = await convertFileToBase64(questionFile);
        questionsFromPdf = base64;
      }

      const res = await api.post("/tutor/assignments/create", {
        judul: data.judul,
        deskripsi: data.deskripsi,
        classSubjectTutorId: data.classSubjectTutorId,
        tanggalMulai: data.tanggalMulai,
        tanggalSelesai: data.tanggalSelesai,
        jenis: "EXERCISE",
        nilaiMaksimal: Number(data.nilaiMaksimal) || 100,
        questionsFromPdf,
      });

      toast.success("Tugas berhasil dibuat");
      router.push("/tutor/assignments");
    } catch {
      toast.error("Gagal membuat tugas");
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

  return (
    <div className="p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <PageHeader
        title="Tambah Tugas"
        description="Buat tugas baru untuk siswa dengan mengisi informasi di bawah."
        breadcrumbs={[
          { label: "Tugas", href: "/tutor/assignments" },
          { label: "Tambah Tugas" },
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
                  {item.class.namaKelas} - {item.subject.namaMapel} (
                  {item.class.academicYear.tahunMulai}/
                  {item.class.academicYear.tahunSelesai})
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

        {/* Tanggal Mulai dan Selesai */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-gray-700 font-medium">
              Tanggal Mulai <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              min={format(new Date(), "yyyy-MM-dd")}
              {...register("tanggalMulai", {
                required: "Tanggal mulai wajib diisi",
                validate: {
                  notBeforeToday: (value) => {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return selectedDate >= today || "Tanggal tidak boleh sebelum hari ini";
                  },
                  beforeEndDate: (value) => {
                    const endDate = getValues("tanggalSelesai");
                    if (!endDate) return true;
                    return new Date(value) <= new Date(endDate) || "Tanggal mulai harus sama dengan atau sebelum tanggal selesai";
                  }
                }
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
              min={format(new Date(), "yyyy-MM-dd")}
              {...register("tanggalSelesai", {
                required: "Tanggal selesai wajib diisi",
                validate: {
                  notBeforeToday: (value) => {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return selectedDate >= today || "Tanggal tidak boleh sebelum hari ini";
                  },
                  afterStartDate: (value) => {
                    const startDate = getValues("tanggalMulai");
                    if (!startDate) return true;
                    return new Date(value) >= new Date(startDate) || "Tanggal selesai harus sama dengan atau setelah tanggal mulai";
                  }
                }
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
            Upload Soal (PDF) - Opsional
          </Label>
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <p className="mt-1 text-xs text-gray-500">
            Upload file PDF berisi soal-soal tugas. Jika tidak diupload, Anda
            akan diarahkan ke halaman pembuatan soal.
          </p>
          {questionFile && (
            <p className="mt-1 text-sm text-green-600">
              File terpilih: {questionFile.name}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-md transition-all"
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
