"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Calendar, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function RosterListPage() {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchActiveClasses();
  }, []);

  const fetchActiveClasses = async () => {
    try {
      setIsLoading(true);
      // Fetch all classes
      // Ideally we should have an endpoint filtered by status, but for now fetch all and filter client side
      // or backend optimization if list is huge.
      const res = await api.get("/classes");
      if (res.data.success) {
        const allClasses = res.data.data.classes || [];
        // Filter only Active Academic Year?
        // User said: "tapi di semester yg aktif"
        // We need to know which one is active.
        // Usually `academicYear.isActive` is boolean.

        const activeOnly = allClasses.filter((c) => c.academicYear?.isActive);
        setClasses(activeOnly);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat daftar kelas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Jadwal Pelajaran"
        description="Pilih kelas untuk mengatur jadwal mingguan"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Jadwal Pelajaran" },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)
        ) : classes.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-10">
            Tidak ada kelas aktif pada tahun ajaran ini.
          </div>
        ) : (
          classes.map((cls) => (
            <Card
              key={cls.id}
              className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
              onClick={() => router.push(`/admin/roster/${cls.id}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                  {cls.namaKelas}
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {cls.academicYear?.tahunMulai}/
                      {cls.academicYear?.tahunSelesai} -{" "}
                      {cls.academicYear?.semester}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{cls.program?.namaPaket || "Umum"}</span>
                  </div>
                  <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                    Status: Aktif
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
