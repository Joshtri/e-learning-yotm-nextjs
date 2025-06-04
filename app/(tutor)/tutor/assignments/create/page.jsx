"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { formatISO } from "date-fns";

export default function AssignmentCreatePage() {
  const [classOptions, setClassOptions] = useState([]);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      waktuMulai: formatISO(new Date(), { representation: "complete" }).slice(
        0,
        16
      ),
      waktuSelesai: formatISO(new Date(), { representation: "complete" }).slice(
        0,
        16
      ),
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
    try {
      const res = await api.post("/tutor/assignments/create", {
        ...data,
        jenis: "EXERCISE",
        nilaiMaksimal: Number(data.nilaiMaksimal),
        batasWaktuMenit: Number(data.batasWaktuMenit),
      });

      toast.success("Tugas berhasil dibuat");

      const assignmentId = res.data.data?.id;
      if (assignmentId) {
        router.push(`/tutor/assignments/${assignmentId}/questions`);
      } else {
        router.push("/tutor/assignments");
      }
    } catch {
      toast.error("Gagal membuat tugas");
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

        {/* Waktu Mulai dan Selesai */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-gray-700 font-medium">
              Waktu Mulai <span className="text-red-500">*</span>
            </Label>
            <Input
              type="datetime-local"
              {...register("waktuMulai", {
                required: "Waktu mulai wajib diisi",
              })}
              className={`mt-1 border ${
                errors.waktuMulai ? "border-red-500" : "border-gray-300"
              } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
            />
            {errors.waktuMulai && (
              <p className="mt-1 text-sm text-red-500">
                {errors.waktuMulai.message}
              </p>
            )}
          </div>
          <div>
            <Label className="text-gray-700 font-medium">
              Waktu Selesai <span className="text-red-500">*</span>
            </Label>
            <Input
              type="datetime-local"
              {...register("waktuSelesai", {
                required: "Waktu selesai wajib diisi",
              })}
              className={`mt-1 border ${
                errors.waktuSelesai ? "border-red-500" : "border-gray-300"
              } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
            />
            {errors.waktuSelesai && (
              <p className="mt-1 text-sm text-red-500">
                {errors.waktuSelesai.message}
              </p>
            )}
          </div>
        </div>

        {/* Batas Waktu dan Nilai Maksimal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-gray-700 font-medium">
              Batas Waktu (menit) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              {...register("batasWaktuMenit", {
                required: "Batas waktu wajib diisi",
                min: 1,
              })}
              className={`mt-1 border ${
                errors.batasWaktuMenit ? "border-red-500" : "border-gray-300"
              } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
              placeholder="Masukkan batas waktu dalam menit"
            />
            {errors.batasWaktuMenit && (
              <p className="mt-1 text-sm text-red-500">
                {errors.batasWaktuMenit.message}
              </p>
            )}
          </div>
          <div>
            <Label className="text-gray-700 font-medium">
              Nilai Maksimal <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              {...register("nilaiMaksimal", {
                required: "Nilai maksimal wajib diisi",
                min: 1,
              })}
              className={`mt-1 border ${
                errors.nilaiMaksimal ? "border-red-500" : "border-gray-300"
              } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
              placeholder="Masukkan nilai maksimal"
            />
            {errors.nilaiMaksimal && (
              <p className="mt-1 text-sm text-red-500">
                {errors.nilaiMaksimal.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-all"
          >
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
