"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { Calendar, Clock, User, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

const DAYS = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

export default function StudentRosterPage() {
  const [roster, setRoster] = useState({}); // { 1: [], 2: [], ... }
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const res = await api.get("/student/roster");
        if (res.data.success) {
          setRoster(res.data.data);
          setClassInfo(res.data.classInfo);
        }
      } catch (error) {
        console.error("Gagal memuat jadwal:", error);
        toast.error("Gagal memuat jadwal pelajaran");
      } finally {
        setLoading(false);
      }
    };

    fetchRoster();
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return "-";
    return format(new Date(isoString), "HH:mm");
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Jadwal Pelajaran"
          description="Memuat informasi jadwal..."
          icon={<Calendar className="h-6 w-6" />}
        />
        <div className="mt-6 text-center text-gray-500">Memuat jadwal...</div>
      </div>
    );
  }

  // Filter out days that have no schedule if desired, or show all mapped days.
  // Showing days 1-6 (Senin-Sabtu) usually covers school days.
  const daysToShow = [1, 2, 3, 4, 5, 6];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Jadwal Pelajaran Kelas ${classInfo?.className || ""} - ${
          classInfo?.program || ""
        }`}
        description={`Tahun Ajaran ${
          classInfo?.academicYear || "-"
        } • Semester ${classInfo?.semester || "-"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Jadwal Pelajaran" },
        ]}
        icon={<Calendar className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysToShow.map((dayNum) => {
          const sessions = roster[dayNum] || [];
          return (
            <Card key={dayNum} className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b bg-slate-50 rounded-t-lg">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                  <span>{DAYS[dayNum]}</span>
                  <Badge variant="secondary">{sessions.length} Mapel</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4 space-y-4">
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 border rounded-lg hover:bg-slate-50 transition-colors bg-white shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-blue-700 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {session.subjectName}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {formatTime(session.startTime)} -{" "}
                            {formatTime(session.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span>{session.tutorName}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm py-8">
                    Tidak ada jadwal
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
