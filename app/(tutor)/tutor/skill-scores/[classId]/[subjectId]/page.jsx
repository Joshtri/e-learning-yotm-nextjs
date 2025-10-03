"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Award, Save, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { EmptyState } from "@/components/ui/empty-state";
import SkeletonTable from "@/components/ui/skeleton/SkeletonTable";

export default function InputSkillScoresPage() {
  const { classId, subjectId } = useParams();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scores, setScores] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);
  
  const fetchStudents = async () => {
    try {
      const res = await api.get(`/tutor/skill-scores/students?classId=${classId}&subjectId=${subjectId}`);
      const studentsData = res.data.data || [];
  
      setStudents(studentsData);
  
      // 🟢 Set nilai awal ke state scores jika sudah pernah dinilai
      setScores(
        Object.fromEntries(
          studentsData
            .filter((s) => s.nilai != null)
            .map((s) => [s.id, s.nilai.toString()])
        )
      );
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat daftar siswa");
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleInputChange = (studentId, value) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = Object.entries(scores).map(([studentId, nilai]) => ({
        studentId,
        subjectId,
        nilai: parseFloat(nilai),
      }));

      await api.post("/tutor/skill-scores/submit", {
        classId,
        subjectId,
        scores: payload,
      });
      toast.success("Berhasil menyimpan nilai skill!");
      router.push("/tutor/skill-scores");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan nilai skill");
    }
  };

  const filledCount = Object.keys(scores).filter(
    (key) => scores[key] && scores[key] !== ""
  ).length;
  const totalStudents = students.length;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Input Nilai Skill"
        description="Masukkan nilai skill siswa untuk mata pelajaran ini."
        breadcrumbs={[
          { label: "Dashboard", href: "/tutor/dashboard" },
          { label: "Nilai Skill", href: "/tutor/skill-scores" },
          { label: "Input Nilai Skill" },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push("/tutor/skill-scores")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Siswa"
          value={totalStudents}
          description="Siswa di kelas ini"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Nilai Terisi"
          value={filledCount}
          description={`${filledCount} dari ${totalStudents} siswa`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend={filledCount === totalStudents ? "up" : undefined}
        />
        <StatsCard
          title="Belum Dinilai"
          value={totalStudents - filledCount}
          description="Siswa yang belum dinilai"
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Daftar Siswa
              </CardTitle>
              <CardDescription>
                Masukkan nilai skill untuk setiap siswa (skala 0-100)
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <SkeletonTable numRows={5} numCols={3} showHeader={true} />
          ) : students.length === 0 ? (
            <EmptyState
              title="Tidak ada siswa"
              description="Belum ada siswa terdaftar di kelas ini."
              icon={<Users className="h-6 w-6 text-muted-foreground" />}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map((student, index) => (
                  <Card key={student.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <Badge variant="secondary" className="mb-1">
                              #{index + 1}
                            </Badge>
                            <h4 className="font-medium">{student.namaLengkap}</h4>
                            <p className="text-sm text-muted-foreground">
                              NISN: {student.nisn || "-"}
                            </p>
                          </div>
                          {scores[student.id] && scores[student.id] !== "" && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Terisi
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`score-${student.id}`}>
                            Nilai Skill
                          </Label>
                          <Input
                            id={`score-${student.id}`}
                            type="number"
                            min={0}
                            max={100}
                            value={scores[student.id] || ""}
                            onChange={(e) =>
                              handleInputChange(student.id, e.target.value)
                            }
                            placeholder="Masukkan nilai (0-100)"
                            className="text-lg font-medium"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/tutor/skill-scores")}
                >
                  Batal
                </Button>
                <Button onClick={handleSubmit} disabled={filledCount === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Nilai ({filledCount}/{totalStudents})
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
