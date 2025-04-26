"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyClassPage() {
  const [myClass, setMyClass] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyClass = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/student/my-class");
      setMyClass(res.data.data);
    } catch (err) {
      console.error("Gagal memuat data kelas:", err);
      toast.error("Gagal memuat data kelas saya");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClass();
  }, []);

  if (isLoading) {
    return (
      <main className="p-6 space-y-6">
        <PageHeader
          title="Kelas Saya"
          description="Informasi lengkap tentang kelas Anda."
        />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (!myClass) {
    return (
      <main className="p-6">
        <PageHeader
          title="Kelas Saya"
          description="Informasi lengkap tentang kelas Anda."
        />
        <p>Anda belum terdaftar dalam kelas manapun.</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <PageHeader
        title="Kelas Saya"
        description="Informasi lengkap tentang kelas, teman sekelas, dan mata pelajaran."
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Kelas Saya" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Informasi Kelas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <b>Nama Kelas:</b> {myClass.namaKelas}
          </p>
          <p>
            <b>Paket Program:</b> {myClass.program?.namaPaket || "-"}
          </p>
          <p>
            <b>Tahun Ajaran:</b> {myClass.academicYear?.tahunMulai}/
            {myClass.academicYear?.tahunSelesai}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teman Seangkatan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {myClass.students?.length > 0 ? (
            <ul className="list-disc pl-4">
              {myClass.students.map((student) => (
                <li key={student.id}>
                  {student.namaLengkap} ({student.user?.email || "-"})
                </li>
              ))}
            </ul>
          ) : (
            <p>Belum ada siswa lain.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mata Pelajaran</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {myClass.classSubjectTutors?.length > 0 ? (
            <ul className="list-disc pl-4">
              {myClass.classSubjectTutors.map((subject) => (
                <li key={subject.id}>{subject.subject?.namaMapel}</li>
              ))}
            </ul>
          ) : (
            <p>Belum ada mata pelajaran tersedia.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
