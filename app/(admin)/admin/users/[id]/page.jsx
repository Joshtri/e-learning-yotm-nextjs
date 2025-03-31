"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, UserCog } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
// import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
//   const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user details
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/users/${id}`);
        setUser(response.data.data);
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
  }, [id, router]);

  // Check if user is admin and redirect if not
//   useEffect(() => {
//     if (currentUser && currentUser.role !== 'ADMIN') {
//       toast.error("Akses ditolak: Halaman ini hanya untuk admin");
//       router.push('/dashboard');
//     }
//   }, [currentUser, router]);

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

  if (!user) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Detail Pengguna: ${user.name}`}
        description={`Informasi lengkap untuk pengguna dengan role ${user.role.toLowerCase()}`}
        backButton={{
          href: "/admin/users",
          label: "Kembali ke daftar pengguna",
        }}
        actions={
          <Button onClick={() => router.push(`/admin/users/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Pengguna
          </Button>
        }
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
              <EntityAvatar name={user.name} size="lg" />
              <div className="text-center">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <StatusBadge
                  status={user.role}
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
                  status={user.userActivated}
                  variants={{
                    ACTIVE: { variant: "success", label: "Aktif" },
                    INACTIVE: { variant: "destructive", label: "Nonaktif" },
                  }}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Dibuat:</span>
                <span>
                  {new Date(user.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tanggal Diperbarui:
                </span>
                <span>
                  {new Date(user.updatedAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific information card */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi {getRoleLabel(user.role)}</CardTitle>
          </CardHeader>
          <CardContent>
            {user.role === "STUDENT" && user.student && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">NISN:</div>
                  <div>{user.student.nisn || "-"}</div>
                  
                  <div className="text-muted-foreground">Jenis Kelamin:</div>
                  <div>{user.student.jenisKelamin || "-"}</div>
                  
                  <div className="text-muted-foreground">Tempat Lahir:</div>
                  <div>{user.student.tempatLahir || "-"}</div>
                  
                  <div className="text-muted-foreground">Tanggal Lahir:</div>
                  <div>
                    {user.student.tanggalLahir 
                      ? new Date(user.student.tanggalLahir).toLocaleDateString("id-ID") 
                      : "-"}
                  </div>
                  
                  <div className="text-muted-foreground">Kelas:</div>
                  <div>{user.student.class?.name || "Belum terdaftar dalam kelas"}</div>
                </div>
                
                {user.student.alamat && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-2 text-muted-foreground">Alamat:</div>
                      <div className="p-3 rounded bg-muted">{user.student.alamat}</div>
                    </div>
                  </>
                )}
              </div>
            )}

            {user.role === "TUTOR" && user.tutor && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Telepon:</div>
                  <div>{user.tutor.telepon || "-"}</div>
                </div>
                
                {user.tutor.bio && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-2 text-muted-foreground">Bio:</div>
                      <div className="p-3 rounded bg-muted">{user.tutor.bio}</div>
                    </div>
                  </>
                )}
                
                {user.tutor.pendidikan && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-2 text-muted-foreground">Pendidikan:</div>
                      <div className="p-3 rounded bg-muted">{user.tutor.pendidikan}</div>
                    </div>
                  </>
                )}
                
                {user.tutor.pengalaman && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-2 text-muted-foreground">Pengalaman:</div>
                      <div className="p-3 rounded bg-muted">{user.tutor.pengalaman}</div>
                    </div>
                  </>
                )}
              </div>
            )}

            {user.role === "ADMIN" && (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Pengguna ini memiliki hak akses sebagai Administrator
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getRoleLabel(role) {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "TUTOR":
      return "Tutor";
    case "STUDENT":
      return "Siswa";
    default:
      return "Pengguna";
  }
}