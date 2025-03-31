"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import FormField from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function TutorCreatePage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      userId: "",
      namaLengkap: "",
      telepon: "",
      pendidikan: "",
      pengalaman: "",
      bio: "",
    },
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get("/tutors/account");
        setUsers(res.data?.data?.users || []);
      } catch (err) {
        console.error("Gagal memuat akun tutor:", err);
        toast.error("Gagal memuat akun yang tersedia");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const onError = (err) => {
    console.warn("Form invalid:", err);
    toast.error("Form belum lengkap!");
  };

  const onSubmit = async (formData) => {
    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        namaLengkap: formData.namaLengkap.trim(),
        telepon: formData.telepon?.trim() || null,
        pendidikan: formData.pendidikan?.trim() || null,
        pengalaman: formData.pengalaman?.trim() || null,
        bio: formData.bio?.trim() || null,
      };

      const res = await api.post("/tutors", payload);

      if (res.data.success) {
        toast.success("Tutor berhasil ditambahkan");
        router.push("/admin/tutors");
      } else {
        throw new Error(res.data.message || "Gagal menambahkan tutor");
      }
    } catch (error) {
      console.error("Gagal submit:", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p>Memuat data akun tutor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tambah Data Tutor"
        description="Lengkapi data tutor berdasarkan akun yang tersedia"
        backButton={{
          href: "/admin/tutors",
          label: "Kembali ke daftar tutor",
        }}
      />

      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Tutor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="userId"
                label="Akun Tutor"
                type="select"
                placeholder="Pilih akun tutor"
                required
                rules={{ required: "Akun wajib dipilih" }}
                options={users.map((user) => ({
                  value: user.id,
                  label: `${user.nama} (${user.email})`,
                }))}
              />

              <FormField
                control={form.control}
                name="namaLengkap"
                label="Nama Lengkap"
                placeholder="Nama lengkap tutor"
                type="text"
                required
                rules={{
                  required: "Nama lengkap wajib diisi",
                  minLength: {
                    value: 3,
                    message: "Minimal 3 karakter",
                  },
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="telepon"
              label="Telepon"
              placeholder="Nomor telepon aktif"
              type="text"
            />

            <FormField
              control={form.control}
              name="pendidikan"
              label="Pendidikan"
              placeholder="Contoh: S1 Pendidikan Matematika"
              type="text"
            />

            <FormField
              control={form.control}
              name="pengalaman"
              label="Pengalaman"
              placeholder="Contoh: Mengajar 3 tahun di SMA"
              type="textarea"
            />

            <FormField
              control={form.control}
              name="bio"
              label="Biografi / Tentang Tutor"
              placeholder="Tulis sedikit tentang tutor ini"
              type="textarea"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/tutors")}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Data
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
