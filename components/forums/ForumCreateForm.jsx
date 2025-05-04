"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";

export default function ForumCreateForm({ onSuccess }) {
  const { register, handleSubmit, reset } = useForm();
  const [classSubjects, setClassSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClassSubjects = async () => {
      try {
        const res = await axios.get("/class-subject-tutors?tutorOnly=true");
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setClassSubjects(data);
      } catch (error) {
        toast.error("Gagal memuat daftar kelas & mapel.");
      }
    };
    fetchClassSubjects();
  }, []);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await axios.post("/forums", data);
      toast.success("Forum berhasil dibuat!");
      onSuccess(res.data);
      reset();
    } catch (err) {
      toast.error("Gagal membuat forum.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block font-medium">Judul Forum</label>
        <Input
          {...register("name", { required: true })}
          placeholder="Contoh: Diskusi Materi Bab 3"
        />
      </div>

      <div>
        <label className="block font-medium">Pilih Kelas & Mapel</label>
        <select
          {...register("classSubjectTutorId", { required: true })}
          className="w-full border rounded p-2"
        >
          <option value="">-- Pilih --</option>
          {Array.isArray(classSubjects) &&
            classSubjects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.class?.namaKelas} - {item.subject?.namaMapel}
              </option>
            ))}
        </select>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Menyimpan..." : "Buat Forum"}
      </Button>
    </form>
  );
}
