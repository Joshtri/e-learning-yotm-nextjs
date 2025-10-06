"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal memuat data");
  const json = await res.json();
  return json && json.data != null ? json.data : json;
};

function getInitials(name) {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/);
  const a = parts[0];
  const b = parts[1];
  return ((a && a[0]) || "") + ((b && b[0]) || "");
}

export default function MyClassPage() {
  // const { toast } = useToast()

  const {
    data: myClass,
    isLoading,
    error,
  } = useSWR("/api/student/my-class", fetcher, { revalidateOnFocus: false });

  useEffect(() => {
    if (error) {
      toast({
        title: "Tidak bisa memuat kelas",
        description: "Silakan coba lagi beberapa saat lagi.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const loadingContent = (
    <main className="p-6 space-y-6">
      <PageHeader
        title="Kelas Saya"
        description="Lihat informasi kelas, teman sekelas, dan mata pelajaran dengan ringkas."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </main>
  );

  if (isLoading) return loadingContent;

  if (!myClass) {
    return (
      <main className="p-6 space-y-6">
        <PageHeader
          title="Kelas Saya"
          description="Lihat informasi kelas, teman sekelas, dan mata pelajaran dengan ringkas."
          breadcrumbs={[
            { label: "Dashboard", href: "/siswa/dashboard" },
            { label: "Kelas Saya" },
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Belum Terdaftar Kelas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-muted-foreground">
            <p>Anda belum terdaftar dalam kelas mana pun saat ini.</p>
            <p>Hubungi admin atau wali kelas untuk mendapatkan akses.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const totalSiswa = (myClass.students && myClass.students.length) || 0;
  const totalMapel =
    (myClass.classSubjectTutors && myClass.classSubjectTutors.length) || 0;
  const placeholderAvatar = "/student-avatar.png";

  return (
    <main className="p-6 space-y-6">
      <PageHeader
        title="Kelas Saya"
        description="Informasi ringkas tentang kelas, teman sekelas, dan mata pelajaran."
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Kelas Saya" },
        ]}
      />

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Informasi Kelas
            </CardTitle>
            <GraduationCap
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {myClass.namaKelas}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {(myClass.program && myClass.program.namaPaket) || "Paket -"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Tahun Ajaran:{" "}
              <span className="text-foreground">
                {(myClass.academicYear && myClass.academicYear.tahunMulai) ||
                  "-"}
                /
                {(myClass.academicYear && myClass.academicYear.tahunSelesai) ||
                  "-"}
              </span>{" "}
              • Semester:{" "}
              <span className="text-foreground">
                {(myClass.academicYear && myClass.academicYear.semester) || "-"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Teman Sekelas
            </CardTitle>
            <Users
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Total siswa:{" "}
              <span className="text-foreground font-medium">{totalSiswa}</span>
            </p>
            <Separator />
            <div className="flex -space-x-2">
              {(myClass.students || []).slice(0, 5).map((s) => (
                <Avatar key={s.id} className="border border-border">
                  <AvatarImage
                    alt={s.namaLengkap}
                    src={placeholderAvatar || "/placeholder.svg"}
                  />
                  <AvatarFallback>{getInitials(s.namaLengkap)}</AvatarFallback>
                </Avatar>
              ))}
              {totalSiswa > 5 && (
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted text-xs">
                  +{totalSiswa - 5}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Mata Pelajaran
            </CardTitle>
            <BookOpen
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Total mapel:{" "}
              <span className="text-foreground font-medium">{totalMapel}</span>
            </p>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {(myClass.classSubjectTutors || []).slice(0, 6).map((m) => (
                <Badge key={m.id} variant="secondary" className="rounded-full">
                  {m.subject && m.subject.namaMapel}
                </Badge>
              ))}
              {totalMapel > 6 && (
                <Badge variant="outline" className="rounded-full">
                  +{totalMapel - 6} lainnya
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Teman Seangkatan</CardTitle>
          </CardHeader>
          <CardContent>
            {totalSiswa > 0 ? (
              <ul className="divide-y divide-border">
                {(myClass.students || []).map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <Avatar className="size-9 border border-border">
                      <AvatarImage
                        alt={s.namaLengkap}
                        src={placeholderAvatar || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {getInitials(s.namaLengkap)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {s.namaLengkap}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {(s.user && s.user.email) || "Email tidak tersedia"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada siswa lain.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mata Pelajaran</CardTitle>
          </CardHeader>
          <CardContent>
            {totalMapel > 0 ? (
              <ul className="grid gap-2">
                {(myClass.classSubjectTutors || []).map((subject) => (
                  <li
                    key={subject.id}
                    className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
                  >
                    <span className="text-sm">
                      {subject.subject && subject.subject.namaMapel}
                    </span>
                    <Badge variant="outline" className="rounded-full">
                      {(subject.tutor &&
                        (subject.tutor.namaLengkap ||
                          subject.tutor.user?.nama)) ||
                        "Tutor"}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada mata pelajaran tersedia.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
