"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, BookOpen } from "lucide-react";
import { toast } from "sonner";
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal memuat data");
  const json = await res.json();
  return json && json.data != null ? json.data : json;
};

export default function MyClassPage() {
  // const { toast } = useToast()

  const {
    data: myClass,
    isLoading,
    error,
  } = useSWR("/api/student/my-class", fetcher, { revalidateOnFocus: false });

  useEffect(() => {
    if (error) {
      toast.error("Tidak bisa memuat data kelas");
    }
  }, [error]);

  const loadingContent = (
    <main className="p-6 space-y-6">
      <PageHeader
        title="Kelas Saya"
        description="Informasi ringkas tentang kelas dan mata pelajaran Anda."
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
          description="Informasi ringkas tentang kelas dan mata pelajaran Anda."
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

  const totalMapel =
    (myClass.classSubjectTutors && myClass.classSubjectTutors.length) || 0;

  return (
    <main className="p-6 space-y-6">
      <PageHeader
        title="Kelas Saya"
        description="Informasi ringkas tentang kelas dan mata pelajaran Anda."
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Kelas Saya" },
        ]}
      />

      <section className="grid gap-6 md:grid-cols-2">
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

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Daftar Mata Pelajaran</CardTitle>
          </CardHeader>
          <CardContent>
            {totalMapel > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {(myClass.classSubjectTutors || []).map((subject) => (
                  <li
                    key={subject.id}
                    className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {subject.subject && subject.subject.namaMapel}
                      </span>
                    </div>
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
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada mata pelajaran tersedia.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
