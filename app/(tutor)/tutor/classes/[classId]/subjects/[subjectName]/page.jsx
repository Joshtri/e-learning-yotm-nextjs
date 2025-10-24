"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  FileText,
  ClipboardList,
  User,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TutorClassSubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const classId = params.classId;
  const subjectName = decodeURIComponent(params.subjectName);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(
        `/tutor/classes/${classId}/subjects/${encodeURIComponent(subjectName)}`
      );
      setData(res.data.data);
    } catch (error) {
      console.error("Error fetching class subject details:", error);
      toast.error(
        error.response?.data?.message ||
          "Gagal memuat detail mata pelajaran kelas"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (classId && subjectName) {
      fetchData();
    }
  }, [classId, subjectName]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Data tidak ditemukan</p>
          <Button className="mt-4" onClick={() => router.back()}>
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const { classSubjectTutor, stats, recentAssignments, recentMaterials } = data;

  const assignmentColumns = [
    {
      header: "Judul",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.judul}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(row.TanggalMulai).toLocaleDateString("id-ID")}
          </div>
        </div>
      ),
    },
    {
      header: "Jenis",
      cell: (row) => {
        const jenisMap = {
          TASK: "Tugas",
          QUIZ: "Kuis",
          DAILY_TEST: "Ujian Harian",
          START_SEMESTER_TEST: "Ujian Awal Semester",
          MID_SEMESTER_TEST: "Ujian Tengah Semester",
          FINAL_SEMESTER_TEST: "Ujian Akhir Semester",
        };
        return (
          <Badge variant="outline">{jenisMap[row.jenis] || row.jenis}</Badge>
        );
      },
    },
    {
      header: "Submissions",
      cell: (row) => (
        <div className="text-sm">
          {row._count?.submissions || 0} submission(s)
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => {
        const now = new Date();
        const start = new Date(row.TanggalMulai);
        const end = new Date(row.TanggalSelesai);

        if (now < start) {
          return <Badge variant="secondary">Belum Dimulai</Badge>;
        } else if (now >= start && now <= end) {
          return <Badge variant="default">Sedang Berlangsung</Badge>;
        } else {
          return <Badge variant="destructive">Sudah Berakhir</Badge>;
        }
      },
    },
    {
      header: "Aksi",
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Navigate based on assignment type
            const basePath = `/tutor/${
              row.jenis === "TASK"
                ? "assignments"
                : row.jenis === "QUIZ"
                ? "quizzes"
                : "exams"
            }/${row.id}`;
            router.push(basePath);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          Lihat
        </Button>
      ),
    },
  ];

  const materialColumns = [
    {
      header: "Judul",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.judul}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(row.createdAt).toLocaleDateString("id-ID")}
          </div>
        </div>
      ),
    },
    {
      header: "Deskripsi",
      cell: (row) => (
        <div className="text-sm text-muted-foreground max-w-md truncate">
          {row.deskripsi || "-"}
        </div>
      ),
    },
    {
      header: "Aksi",
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/tutor/materials/${row.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Lihat
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`${classSubjectTutor.subject.namaMapel} - ${classSubjectTutor.class.namaKelas}`}
        description={`Program ${classSubjectTutor.class.program.namaPaket} • ${classSubjectTutor.class.academicYear.tahunMulai}/${classSubjectTutor.class.academicYear.tahunSelesai} - ${classSubjectTutor.class.academicYear.semester}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Kelas Saya", href: "/tutor/my-classes" },
          {
            label: `${classSubjectTutor.class.namaKelas} - ${classSubjectTutor.subject.namaMapel}`,
          },
        ]}
        icon={<BookOpen className="h-6 w-6" />}
      />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsCount}</div>
            <p className="text-xs text-muted-foreground">Total siswa di kelas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tugas/Ujian</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignmentsCount}</div>
            <p className="text-xs text-muted-foreground">Total assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materi</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.materialsCount}</div>
            <p className="text-xs text-muted-foreground">Total materi ajar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wali Kelas</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {classSubjectTutor.class.homeroomTeacher?.namaLengkap || "-"}
            </div>
            <p className="text-xs text-muted-foreground">Homeroom teacher</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Recent Items */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Tugas/Ujian Terbaru</TabsTrigger>
          <TabsTrigger value="materials">Materi Terbaru</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tugas/Ujian Terbaru</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/tutor/assignments`)}
              >
                Lihat Semua
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentAssignments.length > 0 ? (
                <DataTable
                  data={recentAssignments}
                  columns={assignmentColumns}
                  keyExtractor={(item) => item.id}
                  emptyMessage="Belum ada tugas/ujian"
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada tugas/ujian yang dibuat
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Materi Terbaru</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/tutor/materials`)}
              >
                Lihat Semua
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentMaterials.length > 0 ? (
                <DataTable
                  data={recentMaterials}
                  columns={materialColumns}
                  keyExtractor={(item) => item.id}
                  emptyMessage="Belum ada materi"
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada materi yang dibuat
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
