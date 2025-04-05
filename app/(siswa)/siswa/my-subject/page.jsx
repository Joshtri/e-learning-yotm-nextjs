"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateRange, formatDateTime } from "@/utils/date-format";
import {
  FileText,
  File,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get("/student/my-subjects");
        setSubjects(res.data.data || []);
        setError(null);
      } catch (err) {
        console.error("Failed to load student subjects:", err);
        setError("Gagal memuat data mata pelajaran. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Belum ada mata pelajaran</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Anda belum terdaftar di mata pelajaran apapun saat ini.
      </p>
    </div>
  );

  const renderActiveActivities = (activities, type) => {
    if (!activities || activities.length === 0) return null;

    return (
      <div className="mt-4 space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          {type === "kuis" ? (
            <>
              <FileText className="h-4 w-4" />
              Kuis Aktif
            </>
          ) : (
            <>
              <File className="h-4 w-4" />
              Tugas Aktif
            </>
          )}
        </h4>
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{activity.judul}</p>
                  <Badge
                    variant="outline"
                    className="capitalize"
                    style={{
                      backgroundColor:
                        activity.jenis === "MIDTERM" ? "#f0fdf4" : "#fff",
                      color: activity.jenis === "MIDTERM" ? "#15803d" : "#000",
                    }}
                  >
                    {activity.jenis || "EXERCISE"}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDateRange(
                        activity.waktuMulai,
                        activity.waktuSelesai
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      activity.status === "SUDAH_MENGERJAKAN"
                        ? "success"
                        : activity.status === "BELUM_MENGERJAKAN" &&
                          new Date(activity.waktuSelesai) < new Date()
                        ? "destructive"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {activity.status === "SUDAH_MENGERJAKAN" ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : activity.status === "BELUM_MENGERJAKAN" &&
                      new Date(activity.waktuSelesai) < new Date() ? (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    ) : null}
                    {activity.status.replace("_", " ").toLowerCase()}
                    {new Date(activity.waktuSelesai) < new Date() &&
                      activity.status === "BELUM_MENGERJAKAN" &&
                      " (terlewat)"}
                  </Badge>

                  {activity.status === "BELUM_MENGERJAKAN" &&
                    new Date(activity.waktuSelesai) > new Date() && (
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(
                            type === "kuis"
                              ? `/siswa/quiz/${activity.id}/start`
                              : `/siswa/assignments/${activity.id}/start`
                          )
                        }
                      >
                        Kerjakan
                      </Button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLearningMaterials = (materials) => {
    if (!materials || materials.length === 0) {
      return (
        <div className="text-muted-foreground text-sm py-2">
          Belum ada materi pembelajaran
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {materials.map((material) => (
          <div key={material.id} className="border rounded-lg p-3">
            <h4 className="font-medium">{material.judul}</h4>
            {material.konten && (
              <p className="text-muted-foreground text-sm mt-1">
                {material.konten}
              </p>
            )}
            {material.fileUrl && (
              <div className="mt-2">
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:underline text-sm"
                >
                  <File className="h-4 w-4 mr-2" />
                  Download Materi
                </a>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Dibuat: {formatDateTime(material.createdAt)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  if (loading)
    return (
      <div className="p-6">
        <PageHeader
          title="Mata Pelajaran Anda"
          description="Memuat data mata pelajaran..."
        />
        {renderLoadingSkeleton()}
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <PageHeader
          title="Mata Pelajaran Anda"
          description="Terjadi kesalahan saat memuat data"
        />
        <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/30 text-destructive dark:text-destructive-foreground">
          {error}
          <Button
            variant="ghost"
            className="ml-4"
            onClick={() => window.location.reload()}
          >
            Muat Ulang
          </Button>
        </div>
      </div>
    );

  return (
    <div className="p-6">
      <PageHeader
        title="Mata Pelajaran Anda"
        description="Daftar mata pelajaran beserta materi dan aktivitas pembelajaran"
        breadcrumbs={[
          { label: "Mata Pelajaran", href: "/siswa/subjects" },
          { label: "Daftar Mata Pelajaran" },
        ]}
        
      />

      <div className="mt-6 space-y-4">
        {subjects.length === 0
          ? renderEmptyState()
          : subjects.map((subject) => (
              <Card
                key={subject.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{subject.namaMapel}</span>
                    <Badge variant="outline" className="ml-2">
                      {subject.jumlahMateri} Materi • {subject.jumlahTugas}{" "}
                      Tugas • {subject.jumlahKuis} Kuis
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tutor</p>
                      <p>{subject.tutor}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Aktivitas</p>
                      <p>
                        {subject.jumlahTugas + subject.jumlahKuis} aktivitas
                        tersedia
                      </p>
                    </div>
                  </div>

                  {renderActiveActivities(subject.kuisAktif, "kuis")}
                  {renderActiveActivities(subject.tugasAktif, "tugas")}

                  <Accordion type="single" collapsible>
                    <AccordionItem value={`materi-${subject.id}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Lihat Materi Pembelajaran
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {renderLearningMaterials(subject.materi)}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/siswa/materi/${subject.id}`)}
                    >
                      Lihat Semua Materi
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(`/siswa/mapel/${subject.id}/tugas`)
                      }
                    >
                      Lihat Semua Tugas
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(`/siswa/mapel/${subject.id}/kuis`)
                      }
                    >
                      Lihat Semua Kuis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
