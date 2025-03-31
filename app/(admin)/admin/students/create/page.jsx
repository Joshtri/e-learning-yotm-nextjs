"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import api from "@/lib/axios";
import FormField from "@/components/ui/form-field";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function StudentCreatePage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm({
    defaultValues: {
      userId: "",
      namaLengkap: "",
      nisn: "",
      jenisKelamin: "",
      tempatLahir: "",
      tanggalLahir: "",
      alamat: "",
      classId: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersResponse, classesResponse] = await Promise.all([
          api.get("/students/account"),
          api.get("/classes"),
        ]);

        setUsers(usersResponse.data?.data?.users || []);
        setClasses(classesResponse.data?.data?.classes || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data yang diperlukan");
      } finally {
      setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onError = (errors) => {
    console.log("Form Errors:", errors);
    toast.error("Form belum lengkap!");
  };

  const onSubmit = async (formData) => {
    try {
      setSubmitting(true);

      if (!formData.userId) {
        throw new Error("Pilih akun siswa terlebih dahulu");
      }

      const cleanedData = {
        ...formData,
        namaLengkap: formData.namaLengkap?.trim(),
        nisn: formData.nisn?.trim(),
        tempatLahir: formData.tempatLahir?.trim(),
        alamat: formData.alamat?.trim(),
        classId: formData.classId || null,
      };

      const response = await api.post("/students", cleanedData);

      if (response.data.success) {
        toast.success("Data siswa berhasil ditambahkan");
        router.push("/admin/students");
      } else {
        throw new Error(
          response.data.message || "Gagal menambahkan data siswa"
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error.response?.data?.message || error.message || "Terjadi kesalahan"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tambah Data Siswa"
        description="Lengkapi data siswa berdasarkan akun yang tersedia"
        backButton={{
          href: "/admin/students",
          label: "Kembali ke daftar siswa",
        }}
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Siswa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="userId"
                label="Akun Siswa"
                type="select"
                placeholder="Pilih akun siswa"
                options={users.map((user) => ({
                  value: user.id,
                  label: `${user.nama} (${user.email})`,
                }))}
                required
                rules={{ required: "Akun siswa wajib dipilih" }}
              />

              <FormField
                control={form.control}
                name="namaLengkap"
                label="Nama Lengkap"
                type="text"
                placeholder="Nama lengkap siswa"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nisn"
                label="NISN"
                type="text"
                placeholder="10 digit NISN"
                required
                rules={{
                  required: "NISN wajib diisi",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "NISN harus 10 digit angka",
                  },
                }}
              />

              <FormField
                control={form.control}
                name="jenisKelamin"
                label="Jenis Kelamin"
                type="select"
                required
                placeholder="Pilih jenis kelamin"
                rules={{ required: "Jenis kelamin wajib dipilih" }}
                options={[
                  { value: "MALE", label: "Laki-laki" },
                  { value: "FEMALE", label: "Perempuan" },
                  { value: "OTHER", label: "Lainnya" },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tempatLahir"
                label="Tempat Lahir"
                type="text"
                placeholder="Kota kelahiran"
                required
                rules={{ required: "Tempat lahir wajib diisi" }}
              />

              <FormField
                control={form.control}
                name="tanggalLahir"
                label="Tanggal Lahir"
                type="date"
                required
                rules={{ required: "Tanggal lahir wajib diisi" }}
              />
            </div>

            <FormField
              control={form.control}
              name="alamat"
              label="Alamat"
              type="textarea"
              placeholder="Alamat lengkap siswa"
              required
              rules={{
                required: "Alamat wajib diisi",
                minLength: {
                  value: 10,
                  message: "Alamat minimal 10 karakter",
                },
              }}
            />

            <FormField
              control={form.control}
              name="classId"
              label="Kelas (opsional)"
              type="select"
              placeholder="Pilih kelas siswa (opsional)"
              options={classes.map((kelas) => ({
                value: kelas.id,
                label: `${kelas.namaKelas} - ${
                  kelas.program?.namaPaket || "Tanpa Program"
                }`,
              }))}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/students")}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit, onError)} disabled={submitting || loading}>
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
