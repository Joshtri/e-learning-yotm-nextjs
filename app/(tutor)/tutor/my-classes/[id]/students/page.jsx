"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";

export default function ClassStudentListPage() {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState({});
  const [subject, setSubject] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/tutor/my-classes/${id}/students`);
        const { class: cls, subject: sub, students } = res.data.data;
        setClassInfo(cls);
        setSubject(sub);
        setStudents(students);
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data siswa");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Lengkap",
      cell: (row) => row.namaLengkap || "-",
    },
    {
      header: "NISN",
      cell: (row) => row.nisn || "-",
    },
    {
      header: "Email",
      cell: (row) => row.user?.email || "-",
    },
    {
      header: "Jenis Kelamin",
      cell: (row) => row.jenisKelamin || "-",
    },
    {
      header: "Tempat, Tanggal Lahir",
      cell: (row) =>
        `${row.tempatLahir || "-"}, ${
          row.tanggalLahir
            ? new Date(row.tanggalLahir).toLocaleDateString()
            : "-"
        }`,
    },
    {
      header: "Alamat",
      cell: (row) => row.alamat || "-",
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title={`Daftar Siswa`}
        description={`Kelas ${classInfo?.namaKelas || "-"} | Mapel: ${
          subject?.namaMapel || "-"
        }`}
        backButton={true}
        backButtonLink={`/tutor/my-classes/${id}`}
        breadcrumbs={[
          { label: "Kelas Saya", href: "/tutor/my-classes" },
          { label: `Kelas ${classInfo?.namaKelas || "-"}`, href: `/tutor/my-classes/${id}` },
        ]}
      />

      <DataTable
        data={students}
        columns={columns}
        isLoading={isLoading}
        loadingMessage="Memuat siswa..."
        emptyMessage="Tidak ada siswa ditemukan."
        keyExtractor={(item) => item.id}
      />
    </div>
  );
}
