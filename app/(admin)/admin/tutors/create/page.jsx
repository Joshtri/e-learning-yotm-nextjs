"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Save, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import FormField from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function TutorCreatePage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      userId: "",
      namaLengkap: "",
      telepon: "",
      pendidikan: "",
      pengalaman: "",
      bio: "",
      status: "ACTIVE",
    },
  });

  const selectedUserId = form.watch("userId");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get("/tutors/account");
        const availableUsers = res.data?.data?.users || [];
        setUsers(availableUsers);
        
        if (availableUsers.length === 0) {
          toast.info("Semua akun tutor sudah memiliki profil tutor");
        }
      } catch (err) {
        console.error("Gagal memuat akun tutor:", err);
        toast.error("Gagal memuat akun yang tersedia");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const onError = (errors) => {
    const fieldLabels = {
      userId: "Akun Tutor",
      namaLengkap: "Nama Lengkap",
      telepon: "Telepon",
      pendidikan: "Pendidikan",
      pengalaman: "Pengalaman",
      bio: "Bio",
      status: "Status Tutor",
    };
    const messages = Object.entries(errors)
      .map(([field, error]) => {
        const label = fieldLabels[field] || field;
        return `• ${label}: ${error?.message || "tidak valid"}`;
      })
      .join("\n");
    toast.error(
      messages
        ? `Periksa kembali form:\n${messages}`
        : "Form belum lengkap, periksa kembali isian Anda.",
    );
  };

  const onSubmit = async (formData) => {
    try {
      // Validate userId
      if (!formData.userId) {
        form.setError("userId", {
          type: "manual",
          message: "Akun tutor wajib dipilih",
        });
        toast.error("Silakan pilih akun tutor terlebih dahulu");
        return;
      }

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
        breadcrumbs={[
          { label: "Tutor", href: "/admin/tutors" },
          { label: "Tambah Tutor" },
        ]}
      />

      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Informasi Tutor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Akun Tutor - Combobox with Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Akun Tutor <span className="text-red-500">*</span>
                </label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className={cn(
                        "w-full justify-between font-normal",
                        !selectedUserId && "text-muted-foreground"
                      )}
                    >
                      {selectedUserId
                        ? users.find((u) => u.id === selectedUserId)
                            ?.nama || "Pilih akun tutor..."
                        : "Pilih akun tutor..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Cari akun tutor..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>
                          Tidak ada akun tutor ditemukan.
                        </CommandEmpty>
                        <CommandGroup>
                          {users.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.nama} ${user.email}`}
                              onSelect={() => {
                                form.setValue("userId", user.id);
                                setComboboxOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{user.nama}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedUserId === user.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.userId && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.userId.message}
                  </p>
                )}
              </div>

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

            <FormField
              control={form.control}
              name="status"
              label="Status Tutor"
              type="select"
              required
              placeholder="Pilih status tutor"
              rules={{ required: "Status tutor wajib dipilih" }}
              options={[
                { value: "ACTIVE", label: "Aktif" },
                { value: "INACTIVE", label: "Tidak Aktif" },
              ]}
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
