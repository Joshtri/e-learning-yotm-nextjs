"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      nama: "",
      email: "",
      role: "",
      userActivated: "",
      password: "",
    },
  });

  // Fetch user details
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/users/${id}`);
        const userData = response.data.data;
        setUser(userData);

        // Set form values based on user data
        form.reset({
          nama: userData.nama,
          email: userData.email,
          role: userData.role,
          userActivated: userData.userActivated || "ACTIVE",
          password: "", // Empty by default for security
        });
      } catch (error) {
        console.error("Failed to fetch user details:", error);
        toast.error("Gagal memuat data pengguna");
        router.push("/admin/users");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserData();
    }
  }, [id, router, form]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      // Only include password if it's provided
      const userData = { ...data };
      if (!userData.password) {
        delete userData.password;
      }

      // Update the core user data
      await api.patch(`/users/${id}`, {
        nama: userData.nama,
        email: userData.email,
        role: userData.role,
        userActivated: userData.userActivated,
        password: userData.password,
      });

      toast.success("Pengguna berhasil diperbarui");
      router.push(`/admin/users/${id}`);
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(error.response?.data?.error || "Gagal memperbarui pengguna");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Edit Pengguna: ${user.nama}`}
        description="Perbarui informasi pengguna dan pengaturan akun"
        backButton={{
          href: `/admin/users/${id}`,
          label: "Kembali ke detail pengguna",
        }}
        breadcrumbs={[
          { label: "Pengguna", href: "/admin/users" },
          { label: "Edit Pengguna" },
        ]}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nama"
                  rules={{ required: "Username wajib diisi" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    required: "Email wajib diisi",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Format email tidak valid",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="nama@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  rules={{ required: "Role wajib dipilih" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih role pengguna" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="TUTOR">Tutor</SelectItem>
                          <SelectItem value="STUDENT">Siswa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="userActivated"
                  rules={{ required: "Status wajib dipilih" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status pengguna" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Aktif</SelectItem>
                          <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password (kosongkan jika tidak ingin mengubah)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                "Menyimpan..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
