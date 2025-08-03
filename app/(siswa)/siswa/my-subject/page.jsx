"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  GraduationCap,
  User,
  Activity,
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

  const renderLearningMaterials = (materials) => {
    if (!materials || materials.length === 0) {
      return (
        <div className="text-muted-foreground text-sm py-4 text-center">
          Belum ada materi pembelajaran
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {materials.map((material) => (
          <div key={material.id} className="border rounded-lg p-4">
            <h5 className="font-medium text-sm mb-2">{material.judul}</h5>
            {material.konten && (
              <p className="text-muted-foreground text-sm mb-3">
                {material.konten}
              </p>
            )}
            {material.fileUrl && (
              <div className="mb-3">
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
            <p className="text-xs text-muted-foreground">
              Dibuat: {formatDateTime(material.createdAt)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderActiveActivities = (activities, type) => {
    if (!activities || activities.length === 0) {
      return (
        <div className="text-muted-foreground text-sm py-4 text-center">
          Tidak ada {type} aktif saat ini
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h5 className="font-semibold text-sm mb-2">{activity.judul}</h5>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className="capitalize text-xs"
                    style={{
                      backgroundColor:
                        activity.jenis === "MIDTERM" ? "#f0fdf4" : "#fff",
                      color: activity.jenis === "MIDTERM" ? "#15803d" : "#000",
                    }}
                  >
                    {activity.jenis || "EXERCISE"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDateRange(
                      activity.waktuMulai,
                      activity.waktuSelesai
                    )}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={
                    activity.status === "SUDAH_MENGERJAKAN"
                      ? "success"
                      : activity.status === "BELUM_MENGERJAKAN" &&
                        new Date(activity.waktuSelesai) < new Date()
                      ? "destructive"
                      : "secondary"
                  }
                  className="capitalize text-xs"
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
                      onClick={() => {
                        // Route based on activity type
                        const quizTypes = [
                          "QUIZ",
                          "DAILY_TEST",
                          "START_SEMESTER_TEST",
                          "MIDTERM",
                          "FINAL_EXAM",
                        ];
                        const route = quizTypes.includes(activity.jenis)
                          ? `/siswa/quiz/${activity.id}/start`
                          : `/siswa/assignments/${activity.id}/start`;
                        router.push(route);
                      }}
                    >
                      Kerjakan
                    </Button>
                  )}
              </div>
            </div>
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

      <div className="mt-6">
        {subjects.length === 0 ? (
          renderEmptyState()
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {subjects.map((subject) => (
              <AccordionItem
                key={subject.id}
                value={`subject-${subject.id}`}
                className="border rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">
                          {subject.namaMapel}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <User className="h-4 w-4" />
                          <span>{subject.tutor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        {subject.jumlahMateri} Materi
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {subject.jumlahTugas} Tugas
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <File className="h-3 w-3 mr-1" />
                        {subject.jumlahKuis} Kuis
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4">
                    {/* Subject Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Tutor</p>
                        <p className="font-medium">{subject.tutor}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Aktivitas
                        </p>
                        <p className="font-medium">
                          {subject.jumlahTugas + subject.jumlahKuis} aktivitas
                          tersedia
                        </p>
                      </div>
                    </div>

                    {/* Nested Accordions */}
                    <Accordion type="multiple" className="space-y-2">
                      {(() => {
                        // Separate tugasAktif by type
                        const exerciseActivities = (
                          subject.tugasAktif || []
                        ).filter(
                          (activity) =>
                            !activity.jenis || activity.jenis === "EXERCISE"
                        );

                        const nonExerciseActivities = (
                          subject.tugasAktif || []
                        ).filter(
                          (activity) =>
                            activity.jenis && activity.jenis !== "EXERCISE"
                        );

                        // Group non-exercise activities by type
                        const groupedNonExercise = nonExerciseActivities.reduce(
                          (groups, activity) => {
                            const type = activity.jenis;
                            if (!groups[type]) {
                              groups[type] = [];
                            }
                            groups[type].push(activity);
                            return groups;
                          },
                          {}
                        );

                        // Type configurations
                        const typeConfigs = {
                          DAILY_TEST: {
                            label: "Ujian Harian",
                            icon: FileText,
                            color: "text-orange-600",
                            description: "Ujian Harian",
                          },
                          START_SEMESTER_TEST: {
                            label: "UAS",
                            icon: FileText,
                            color: "text-red-600",
                            description: "Ujian Awal Semester",
                          },
                          MIDTERM: {
                            label: "UTS",
                            icon: FileText,
                            color: "text-indigo-600",
                            description: "Ujian Tengah Semester",
                          },
                          FINAL_EXAM: {
                            label: "UAS",
                            icon: FileText,
                            color: "text-red-700",
                            description: "Ujian Akhir Semester",
                          },
                          MATERIAL: {
                            label: "Materi",
                            icon: BookOpen,
                            color: "text-purple-600",
                            description: "Materi Pembelajaran",
                          },
                        };

                        return (
                          <>
                            {/* Kuis Aktif - Always show */}
                            <AccordionItem
                              value={`kuis-${subject.id}`}
                              className="border rounded-lg"
                            >
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">
                                    Kuis Aktif
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                  >
                                    {subject.kuisAktif?.length || 0}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                {renderActiveActivities(
                                  subject.kuisAktif,
                                  "kuis"
                                )}
                              </AccordionContent>
                            </AccordionItem>

                            {/* Tugas Aktif - Only EXERCISE type */}
                            <AccordionItem
                              value={`tugas-${subject.id}`}
                              className="border rounded-lg"
                            >
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center gap-2">
                                  <File className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">
                                    Tugas Aktif
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                  >
                                    {exerciseActivities.length}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                {renderActiveActivities(
                                  exerciseActivities,
                                  "tugas"
                                )}
                              </AccordionContent>
                            </AccordionItem>

                            {/* Other Types - Separate accordions for each non-exercise type */}
                            {Object.entries(groupedNonExercise).map(
                              ([type, activities]) => {
                                const config = typeConfigs[type];
                                if (!config) return null;

                                const IconComponent = config.icon;

                                return (
                                  <AccordionItem
                                    key={`${type}-${subject.id}`}
                                    value={`${type}-${subject.id}`}
                                    className="border rounded-lg"
                                  >
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <IconComponent
                                          className={`h-4 w-4 ${config.color}`}
                                        />
                                        <span className="font-medium">
                                          {config.description}
                                        </span>
                                        <Badge
                                          variant="secondary"
                                          className="ml-2 text-xs"
                                        >
                                          {activities.length}
                                        </Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                      {renderActiveActivities(
                                        activities,
                                        type.toLowerCase()
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                );
                              }
                            )}

                            {/* Learning Materials */}
                            <AccordionItem
                              value={`materi-${subject.id}`}
                              className="border rounded-lg"
                            >
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-purple-600" />
                                  <span className="font-medium">
                                    Materi Pembelajaran
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                  >
                                    {subject.materi?.length || 0}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                {renderLearningMaterials(subject.materi)}
                              </AccordionContent>
                            </AccordionItem>
                          </>
                        );
                      })()}
                    </Accordion>


                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
