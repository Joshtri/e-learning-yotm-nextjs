"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PromoteStudentsPage() {
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [originClasses, setOriginClasses] = useState([]);
  const [targetClasses, setTargetClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOriginClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) fetchPromotionData(selectedClassId);
  }, [selectedClassId]);

  const fetchOriginClasses = async () => {
    try {
      const res = await api.get("/tutor/my-classes");
      setOriginClasses(res.data.data || []);
    } catch {
      toast.error("Gagal memuat kelas Anda");
    }
  };

  const fetchPromotionData = async (classId) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/tutor/promotions-init?classId=${classId}`);
      setStudents(res.data.data.students || []);
      setTargetClasses(res.data.data.targetClasses || []);
    } catch {
      toast.error("Gagal memuat data promosi siswa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchChange = (studentId, checked) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, naikKelas: checked } : s))
    );
  };

  const handlePromote = async () => {
    try {
      await api.post("/tutor/promotions", {
        classId: selectedClassId,
        targetClassId,
        promotions: students.map((s) => ({
          studentId: s.id,
          naikKelas: s.naikKelas || false,
        })),
      });
      toast.success("Berhasil mempromosikan siswa");
    } catch {
      toast.error("Gagal memproses promosi siswa");
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Naik Kelas Massal"
        description="Tentukan siswa yang naik kelas dan pilih kelas tujuan."
        breadcrumbs={[
          { label: "Kelas", href: "/tutor/my-classes" },
          { label: "Naik Kelas Massal", href: "/tutor/promote-students" },
        ]}
        backButton={true}
      />

      <div className="space-y-4">
        <div className="flex gap-4">
          <Select onValueChange={setSelectedClassId} value={selectedClassId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Kelas Asal" />
            </SelectTrigger>
            <SelectContent>
              {originClasses.map((cls) => (
                <SelectItem key={cls.class.id} value={cls.class.id}>
                  {cls.class.namaKelas} - {cls.subject.namaMapel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setTargetClassId} value={targetClassId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Kelas Tujuan" />
            </SelectTrigger>
            <SelectContent>
              {targetClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.namaKelas} ({cls.academicYear.tahunMulai}/
                  {cls.academicYear.tahunSelesai})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          data={students}
          columns={[
            {
              header: "No",
              cell: (_, i) => i + 1,
              className: "w-[50px]",
            },
            { header: "Nama", cell: (row) => row.namaLengkap },
            {
              header: "Nilai Akhir",
              cell: (row) => (row.nilaiAkhir ?? "-").toString(),
            },
            {
              header: "Naik Kelas",
              cell: (row) => (
                <Switch
                  checked={!!row.naikKelas}
                  onCheckedChange={(val) => handleSwitchChange(row.id, val)}
                />
              ),
            },
          ]}
          isLoading={isLoading}
          loadingMessage="Memuat data siswa..."
          emptyMessage="Tidak ada siswa ditemukan"
          keyExtractor={(s) => s.id}
        />

        <div className="pt-4">
          <Button onClick={handlePromote} disabled={!targetClassId}>
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>
  );
}
