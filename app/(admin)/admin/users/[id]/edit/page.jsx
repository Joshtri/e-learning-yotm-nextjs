"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import api from "@/lib/axios";
// import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();
  // const { user: currentUser } = useAuth();
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
      // Student fields
      nisn: "",
      jenisKelamin: "",
      tempatLahir: "",
      tanggalLahir: "",
      alamat: "",
      // Tutor fields
      telepon: "",
      bio: "",
      pendidikan: "",
      pengalaman: "",
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
          
          // Student fields (if applicable)
          nisn: userData.student?.nisn || "",
          jenisKelamin: userData.student?.jenisKelamin || "",
          tempatLahir: userData.student?.tempatLahir || "",
          tanggalLahir: userData.student?.tanggalLahir ? new Date(userData.student.tanggalLahir).toISOString().split('T')[0] : "",
          alamat: userData.student?.alamat || "",
          
          // Tutor fields (if applicable)
          telepon: userData.tutor?.telepon || "",
          bio: userData.tutor?.bio || "",
          pendidikan: userData.tutor?.pendidikan || "",
          pengalaman: userData.tutor?.pengalaman || "",
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

  // Check if user is admin and redirect if not
  // useEffect(() => {
  //   if (currentUser && currentUser.role !== 'ADMIN') {
  //     toast.error("Akses ditolak: Halaman ini hanya untuk admin");
  //     router.push('/dashboard');
  //   }
  // }, [currentUser, router]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      // Only include password if it's provided
      const userData = { ...data };
      if (!userData.password) {
        delete userData.password;
      }
      
      // Separate core user data from role-specific data
      const { 
        nama, email, role, userActivated, password,
        nisn, jenisKelamin, tempatLahir, tanggalLahir, alamat,
        telepon, bio, pendidikan, pengalaman,
        ...rest
      } = userData;
      
      // Update the core user data
      await api.patch(`/users/${id}`, {
        nama, email, role, userActivated, password
      });
      
      // If it's a student, update student-specific data
      if (role === "STUDENT") {
        // Check if student record exists
        const studentExists = user.student !== null;
        
        if (studentExists) {
          await api.patch(`/students/${user.student.id}`, {
            nisn, jenisKelamin, tempatLahir, tanggalLahir, alamat
          });
        } else {
          await api.post(`/students`, {
            userId: id,
            nisn, jenisKelamin, tempatLahir, tanggalLahir, alamat
          });
        }
      }
      
      // If it's a tutor, update tutor-specific data
      if (role === "TUTOR") {
        // Check if tutor record exists
        const tutorExists = user.tutor !== null;
        
        if (tutorExists) {
          await api.patch(`/tutors/${user.tutor.id}`, {
            telepon, bio, pendidikan, pengalaman
          });
        } else {
          await api.post(`/tutors`, {
            userId: id,
            telepon, bio, pendidikan, pengalaman
          });
        }
      }
      
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

  // if (!user) {
  //   return null; // Will be redirected by the useEffect
  // }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Edit Pengguna: ${user.nama}`}
        description="Perbarui informasi pengguna dan pengaturan akun"
        backButton={{
          href: `/admin/users/${id}`,
          label: "Kembali ke detail pengguna",
        }}
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
                  rules={{ required: "Nama wajib diisi" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama lengkap" {...field} />
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
                    <FormLabel>Password (kosongkan jika tidak ingin mengubah)</FormLabel>
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

          {form.watch("role") === "STUDENT" && (
            <Card>
              <CardHeader>
                <CardTitle>Informasi Siswa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nisn"
                    rules={{ required: "NISN wajib diisi" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NISN</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan NISN" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jenisKelamin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Kelamin</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis kelamin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                            <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tempatLahir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempat Lahir</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan tempat lahir" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tanggalLahir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Lahir</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="alamat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan alamat lengkap"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {form.watch("role") === "TUTOR" && (
            <Card>
              <CardHeader>
                <CardTitle>Informasi Tutor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="telepon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nomor telepon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan bio singkat"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="pendidikan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Riwayat Pendidikan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan riwayat pendidikan"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pengalaman"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pengalaman Mengajar</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan pengalaman mengajar"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/users/${id}`)}
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