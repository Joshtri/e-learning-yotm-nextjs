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
  const { register, handleSubmit, setValue, watch } = useForm();

  const fetchClassOptions = async () => {
    try {
      const res = await api.get("/tutor/my-classes");
      setClassOptions(res.data.data || []);
    } catch {
      toast.error("Gagal memuat kelas Anda");
    }
  };

  useEffect(() => {
    fetchClassOptions();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post("/tutor/assignments/create", {
        ...data,
        jenis: "EXERCISE",
        nilaiMaksimal: Number(data.nilaiMaksimal),
        batasWaktuMenit: Number(data.batasWaktuMenit),
      });
      toast.success("Tugas berhasil dibuat");
      router.push("/tutor/assignments");
    } catch {
      toast.error("Gagal membuat tugas");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Tambah Tugas"
        description="Buat tugas baru untuk siswa."
        breadcrumbs={[
          { title: "Tugas", href: "/tutor/assignments" },
          { title: "Tambah Tugas", href: "/tutor/assignments/create" },
        ]}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div>
          <Label>Judul</Label>
          <Input {...register("judul", { required: true })} />
        </div>
        <div>
          <Label>Deskripsi</Label>
          <Textarea {...register("deskripsi")} />
        </div>
        <div>
          <Label>Kelas dan Mapel</Label>
          <Select onValueChange={(val) => setValue("classSubjectTutorId", val)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kelas & mapel" />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.class.namaKelas} - {item.subject.namaMapel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Waktu Mulai</Label>
            <Input
              type="datetime-local"
              {...register("waktuMulai")}
              defaultValue={formatISO(new Date(), {
                representation: "complete",
              }).slice(0, 16)}
            />
          </div>
          <div>
            <Label>Waktu Selesai</Label>
            <Input
              type="datetime-local"
              {...register("waktuSelesai")}
              defaultValue={formatISO(new Date(), {
                representation: "complete",
              }).slice(0, 16)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Batas Waktu (menit)</Label>
            <Input type="number" {...register("batasWaktuMenit")} />
          </div>
          <div>
            <Label>Nilai Maksimal</Label>
            <Input type="number" {...register("nilaiMaksimal")} />
          </div>
        </div>
        <div className="pt-4">
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </div>
  );
}
