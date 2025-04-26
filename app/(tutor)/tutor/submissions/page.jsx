"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await axios.get("/api/tutor/submissions");
        setSubmissions(res.data.data);
      } catch (error) {
        console.error("Gagal mengambil data submission:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const statusColor = {
    NOT_STARTED: "bg-gray-200 text-gray-700",
    IN_PROGRESS: "bg-yellow-200 text-yellow-800",
    SUBMITTED: "bg-blue-200 text-blue-800",
    GRADED: "bg-green-200 text-green-800",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Daftar Pengumpulan Siswa</h1>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[75vh] pr-2">
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <p className="text-muted-foreground text-center">
                Belum ada pengumpulan.
              </p>
            ) : (
              submissions.map((sub) => (
                <Card key={sub.id}>
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {sub.assignment?.title || sub.quiz?.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {sub.assignment?.classSubjectTutor?.class?.namaKelas} •{" "}
                        {sub.assignment?.classSubjectTutor?.subject
                          ?.namaMapel ||
                          sub.quiz?.classSubjectTutor?.subject?.namaMapel}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${statusColor[sub.status] || "bg-gray-100"}`}
                    >
                      {sub.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium">Siswa:</span>{" "}
                      {sub.student.namaLengkap}
                    </p>
                    <p>
                      <span className="font-medium">NISN:</span>{" "}
                      {sub.student.nisn}
                    </p>
                    {sub.nilai != null && (
                      <p>
                        <span className="font-medium">Nilai:</span> {sub.nilai}
                      </p>
                    )}
                    {sub.waktuKumpul && (
                      <p>
                        <span className="font-medium">Waktu Kumpul:</span>{" "}
                        {format(
                          new Date(sub.waktuKumpul),
                          "d MMM yyyy, HH:mm",
                          {
                            locale: id,
                          }
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
