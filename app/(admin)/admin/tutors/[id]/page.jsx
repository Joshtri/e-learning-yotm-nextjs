"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, UserCog } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function TutorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        const res = await api.get(`/tutors/${id}`);
        setTutor(res.data.data);
      } catch (error) {
        toast.error("Gagal memuat data tutor");
        router.push("/admin/tutors");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTutorData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (!tutor) return null;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Detail Tutor: ${tutor.user.name}`}
        description="Informasi lengkap terkait tutor"
        backButton={{
          href: "/admin/tutors",
          label: "Kembali ke daftar tutor",
        }}
        actions={
          <Button onClick={() => router.push(`/admin/tutors/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Tutor
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Tutor", href: "/admin/tutors" },
          { label: tutor.user.name },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCog className="mr-2 h-5 w-5" />
              Informasi Dasar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-4">
              <EntityAvatar name={tutor.user.name} size="lg" />
              <div className="text-center">
                <h3 className="text-xl font-semibold">{tutor.user.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {tutor.user.email}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <StatusBadge
                  status={tutor.user.role}
                  variants={{
                    ADMIN: { variant: "default", label: "Admin" },
                    TUTOR: { variant: "secondary", label: "Tutor" },
                    STUDENT: { variant: "outline", label: "Siswa" },
                  }}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <StatusBadge
                  status={tutor.user.userActivated}
                  variants={{
                    ACTIVE: { variant: "success", label: "Aktif" },
                    INACTIVE: { variant: "destructive", label: "Nonaktif" },
                  }}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Dibuat:</span>
                <span>
                  {new Date(tutor.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tanggal Diperbarui:
                </span>
                <span>
                  {new Date(tutor.updatedAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Tutor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Telepon:</div>
              <div>{tutor.telepon || "-"}</div>
            </div>

            {tutor.bio && (
              <>
                <Separator />
                <div>
                  <div className="mb-2 text-muted-foreground">Bio:</div>
                  <div className="p-3 rounded bg-muted">{tutor.bio}</div>
                </div>
              </>
            )}

            {tutor.pendidikan && (
              <>
                <Separator />
                <div>
                  <div className="mb-2 text-muted-foreground">Pendidikan:</div>
                  <div className="p-3 rounded bg-muted">{tutor.pendidikan}</div>
                </div>
              </>
            )}

            {tutor.pengalaman && (
              <>
                <Separator />
                <div>
                  <div className="mb-2 text-muted-foreground">Pengalaman:</div>
                  <div className="p-3 rounded bg-muted">{tutor.pengalaman}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
