"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";

import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function TutorEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    namaLengkap: "",
    telepon: "",
    pendidikan: "",
    pengalaman: "",
    bio: "",
  });

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const res = await api.get(`/tutors/${id}`);
        const tutor = res.data.data;
        setForm({
          namaLengkap: tutor.namaLengkap || "",
          telepon: tutor.telepon || "",
          pendidikan: tutor.pendidikan || "",
          pengalaman: tutor.pengalaman || "",
          bio: tutor.bio || "",
        });
      } catch (error) {
        toast.error("Gagal memuat data tutor");
        router.push("/admin/tutors");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTutor();
  }, [id, router]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/tutors/${id}`, form);
      toast.success("Data tutor berhasil diperbarui");
      router.push(`/admin/tutors/${id}`);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui data tutor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Edit Tutor`}
        description="Informasi lengkap terkait tutor"
        backButton={{
          href: "/admin/tutors",
          label: "Kembali ke daftar tutor",
        }}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Tutor", href: "/admin/tutors" },
          { label: "Edit Tutor" },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Formulir Edit Tutor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nama Lengkap</Label>
                <Input
                  name="namaLengkap"
                  value={form.namaLengkap}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>Telepon</Label>
                <Input
                  name="telepon"
                  value={form.telepon}
                  onChange={handleChange}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Pendidikan</Label>
                <Input
                  name="pendidikan"
                  value={form.pendidikan}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>Pengalaman</Label>
                <Input
                  name="pengalaman"
                  value={form.pengalaman}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tuliskan bio tutor di sini..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
