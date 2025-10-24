// File: app/admin/classes/page.jsx
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { DataExport } from "@/components/ui/data-export";

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/classes");
      setClasses(res.data.data.classes || []);
    } catch (err) {
      toast.error("Gagal memuat data kelas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const groupedByYear = classes.reduce((acc, cls) => {
    const ay = cls.academicYear;
    const label = ay
      ? `${ay.tahunMulai}/${ay.tahunSelesai} - ${ay.semester}`
      : "Tidak Diketahui";
    if (!acc[label]) acc[label] = [];
    acc[label].push(cls);
    return acc;
  }, {});

  // Urutkan setiap grup berdasarkan nama program (paket)
  Object.keys(groupedByYear).forEach((year) => {
    groupedByYear[year].sort((a, b) => {
      const paketA = a.program?.namaPaket || "";
      const paketB = b.program?.namaPaket || "";
      return paketA.localeCompare(paketB, "id"); // sort alfabetis A-Z
    });
  });

  const columns = [
    {
      header: "No",
      cell: (_, i) => i + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama Kelas",
      accessorKey: "namaKelas",
    },
    {
      header: "Program",
      cell: (row) => row.program?.namaPaket || "-",
    },
    {
      header: "Tahun Ajaran",
      cell: (row) => {
        const ay = row.academicYear;
        return ay ? `${ay.tahunMulai}/${ay.tahunSelesai}` : "-";
      },
    },
    {
      header: "Semester",
      cell: (row) => row.academicYear?.semester || "-",
    },
    {
      header: "Wali Kelas",
      cell: (row) => row.homeroomTeacher?.user?.nama || "-",
    },
    {
      header: "Aksi",
      className: "w-[120px]",
      cell: (row) => (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/admin/classes/${row.id}/edit`)}
          >
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/admin/classes/${row.id}`)}
          >
            Detail
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Manajemen Kelas"
            actions={
              <>
                <DataExport
                  data={classes}
                  filename="kelas.csv"
                  label="Export"
                />
                <Button
                  className="ml-2"
                  onClick={() => router.push("/admin/classes/create")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kelas
                </Button>
              </>
            }
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Kelas" },
            ]}
          />

          <Accordion type="multiple" className="space-y-4 mt-6">
            {Object.entries(groupedByYear).map(([year, items]) => (
              <AccordionItem key={year} value={year}>
                <AccordionTrigger>{year}</AccordionTrigger>
                <AccordionContent>
                  <DataTable
                    data={items}
                    columns={columns}
                    isLoading={isLoading}
                    loadingMessage={`Memuat kelas untuk tahun ${year}...`}
                    emptyMessage={`Tidak ada kelas untuk tahun ${year}`}
                    keyExtractor={(item) => item.id}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </main>
      </div>
    </div>
  );
}
