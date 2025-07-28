"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import LogItemCard from "@/components/Log/LogItemCard";
import { TypographyH2, TypographyP } from "@/components/ui/typography";
import { Section } from "@/components/ui/section"; // ⬅️ pakai Section
import { Stack } from "@/components/ui/stack";
import { PageHeader } from "@/components/ui/page-header";

export default function LogActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/logs/my-activity")
      .then((res) => {
        setLogs(res.data.logs || []);
      })
      .catch(() => {
        console.error("Gagal memuat log aktivitas");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Section>
      <Stack className="space-y-2">
        {/* <TypographyH2>Log Aktivitas</TypographyH2> */}
        <PageHeader
          breadcrumbs={[
            { label: "Dashboard", href: "/homeroom/dashboard" },
            { label: "Log Aktivitas" },
          ]}
          title="Log Aktivitas"
          description="Riwayat aktivitas penting pada akun Anda, seperti login, logout, dan pembaruan data."
        />
        <TypographyP>
          Riwayat aktivitas penting pada akun Anda, seperti login, logout, dan
          pembaruan data.
        </TypographyP>
      </Stack>

      <Separator className="my-6" />

      <ScrollArea className="h-[70vh] pr-2">
        {loading ? (
          <Stack className="space-y-4">
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
          </Stack>
        ) : logs.length === 0 ? (
          <TypographyP className="text-center">
            Belum ada aktivitas tercatat.
          </TypographyP>
        ) : (
          <Stack className="space-y-4">
            {logs.map((log) => (
              <LogItemCard key={log.id} log={log} />
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Section>
  );
}
