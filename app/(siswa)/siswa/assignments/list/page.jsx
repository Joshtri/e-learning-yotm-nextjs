// File: app/(student|siswa)/subjects/page.jsx

"use client";

import { AcademicYearFilter } from "@/components/AcademicYearFilter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { PageHeader } from "@/components/ui/page-header";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classOptions, setClassOptions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/student/assignments");
        const data = res.data.data || [];
        setSubjects(data);

        const academicYearSet = new Map();
        const classSet = new Map();

        data.forEach((s) => {
          if (s.academicYearId && s.academicYear) {
            academicYearSet.set(s.academicYearId, s.academicYear);
          }
          if (s.classId && s.className) {
            classSet.set(s.classId, s.className);
          }
        });

        const yearArr = Array.from(academicYearSet.entries()).map(
          ([id, tahun]) => {
            const [tahunMulai, tahunSelesai] = tahun.split("/");
            return { id, tahunMulai, tahunSelesai };
          }
        );
        const classArr = Array.from(classSet.entries()).map(
          ([value, label]) => ({ value, label })
        );

        setAcademicYears(yearArr);
        setClassOptions(classArr);

        if (yearArr.length > 0) setSelectedAcademicYearId(yearArr[0].id);
      } catch (error) {
        console.error("Gagal memuat data mata pelajaran siswa:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSubjects = subjects.filter((s) => {
    if (selectedAcademicYearId && s.academicYearId !== selectedAcademicYearId)
      return false;
    if (selectedClassId && s.classId !== selectedClassId) return false;
    return true;
  });

  if (loading) return <div className="p-6">Memuat...</div>;

  return (
    <div className="p-6">
      <PageHeader
        title="Tugas Anda"
        description="Daftar tugas yang sudah dikerjakan dan belum dikerjakan"
        actions={
          <div className="flex gap-2">
            <AcademicYearFilter
              academicYears={academicYears}
              selectedId={selectedAcademicYearId}
              onChange={setSelectedAcademicYearId}
            />
            <FilterDropdown
              options={classOptions}
              onSelect={setSelectedClassId}
              label="Kelas"
            />
          </div>
        }
        breadcrumbs={[{ label: "Tugas" }]}
      />

      <div className="grid gap-4 mt-6">
        {filteredSubjects.length === 0 ? (
          <div className="text-muted-foreground">
            Tidak ada mata pelajaran ditemukan
          </div>
        ) : (
          filteredSubjects.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.namaMapel}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  <strong>Tutor:</strong> {item.tutor}
                </p>
                <p>
                  <strong>Kelas:</strong> {item.className}
                </p>
                <p>
                  <strong>Tahun Ajaran:</strong> {item.academicYear}
                </p>
                <p>
                  <strong>Jumlah Materi:</strong> {item.jumlahMateri || 0}
                </p>

                {item.tugasAktif?.length > 0 && (
                  <div>
                    <p className="font-medium">Tugas:</p>
                    {item.tugasAktif.map((tugas) => (
                      <div
                        key={tugas.id}
                        className="flex justify-between items-center gap-4 py-2 border-b last:border-none"
                      >
                        <div>
                          <p className="font-semibold">{tugas.judul}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tugas.waktuMulai).toLocaleString("id-ID")}{" "}
                            -{" "}
                            {new Date(tugas.waktuSelesai).toLocaleString(
                              "id-ID"
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              tugas.status === "SUDAH_MENGERJAKAN"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {tugas.status.replace("_", " ")}
                          </Badge>

                          {tugas.status === "BELUM_MENGERJAKAN" ? (
                            <button
                              onClick={() =>
                                router.push(
                                  `/siswa/assignments/${tugas.id}/start`
                                )
                              }
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              Kerjakan
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                router.push(
                                  `/siswa/assignments/${tugas.id}/preview`
                                )
                              }
                              className="text-sm font-medium text-gray-600 hover:underline"
                            >
                              Lihat Jawaban Anda
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
