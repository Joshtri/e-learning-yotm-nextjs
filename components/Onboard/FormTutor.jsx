"use client";

import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BookOpen, User, GraduationCap, Award, Phone } from "lucide-react";

// Education level constants
const EducationLevel = {
  S3: "S3",
  S2: "S2",
  S1: "S1",
  D4: "D4",
  D3: "D3",
  D2: "D2",
  D1: "D1",
  SMA: "SMA",
};

const EducationLevelLabels = {
  S3: "Doktor (S3)",
  S2: "Magister (S2)",
  S1: "Sarjana (S1)",
  D4: "Diploma 4 (D4)",
  D3: "Diploma 3 (D3)",
  D2: "Diploma 2 (D2)",
  D1: "Diploma 1 (D1)",
  SMA: "SMA/SMK/Sederajat",
};

export function FormTutor({ userId, onSuccess }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await axios.post("/api/tutors", { ...data, userId });
      toast.success("Berhasil menyimpan data profil tutor!");
      localStorage.setItem("onboardSuccess", "true");
      onSuccess?.();
      router.push("/tutor/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Gagal menyimpan data. Coba lagi."
      );
    }
  };

  return (
    <div className="p-6 rounded-lg border bg-white shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label className="flex items-center text-gray-800">
            <User className="h-4 w-4 mr-2" />
            Nama Lengkap
          </Label>
          <Input
            placeholder="Masukkan nama lengkap"
            {...register("namaLengkap", {
              required: "Nama lengkap wajib diisi",
            })}
          />
          {errors.namaLengkap && (
            <p className="text-sm text-red-500 mt-1">
              {errors.namaLengkap.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center text-gray-800">
            <BookOpen className="h-4 w-4 mr-2" />
            Bio Singkat
          </Label>
          <Input
            placeholder="Ceritakan sedikit tentang diri Anda"
            {...register("bio", { required: "Bio wajib diisi" })}
          />
          {errors.bio && (
            <p className="text-sm text-red-500 mt-1">{errors.bio.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center text-gray-800">
            <GraduationCap className="h-4 w-4 mr-2" />
            Jenjang Pendidikan
          </Label>
          <Controller
            name="pendidikan"
            control={control}
            rules={{ required: "Pendidikan wajib dipilih" }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenjang pendidikan" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EducationLevelLabels).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.pendidikan && (
            <p className="text-sm text-red-500 mt-1">
              {errors.pendidikan.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center text-gray-800">
            <Award className="h-4 w-4 mr-2" />
            Pengalaman
          </Label>
          <Input
            placeholder="Contoh: 5 tahun mengajar Matematika"
            {...register("pengalaman", { required: "Pengalaman wajib diisi" })}
          />
          {errors.pengalaman && (
            <p className="text-sm text-red-500 mt-1">
              {errors.pengalaman.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center text-gray-800">
            <Phone className="h-4 w-4 mr-2" />
            Nomor Telepon
          </Label>
          <Input
            placeholder="Contoh: 08123456789"
            {...register("telepon", { required: "No. telepon wajib diisi" })}
          />
          {errors.telepon && (
            <p className="text-sm text-red-500 mt-1">
              {errors.telepon.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Data Tutor"}
        </Button>
      </form>
    </div>
  );
}
