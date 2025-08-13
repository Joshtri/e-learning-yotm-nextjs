"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { Sun, Sunrise, Sunset, Moon, CalendarDays, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Utils
function formatDate(d, locale = "id-ID") {
  return d.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
});
}

function formatTime(d, locale = "id-ID") {
  return d.toLocaleTimeString(locale, { hour12: false });
}

function getGreeting(hour) {
  if (hour >= 4 && hour < 10)
    return { text: "Selamat pagi", Icon: Sunrise, accent: "text-amber-600" };
  if (hour >= 10 && hour < 15)
    return { text: "Selamat siang", Icon: Sun, accent: "text-yellow-600" };
  if (hour >= 15 && hour < 18)
    return { text: "Selamat sore", Icon: Sunset, accent: "text-orange-600" };
  return { text: "Selamat malam", Icon: Moon, accent: "text-indigo-600" };
}

export default function GreetingWidget(props = {}) {
  const { name, locale = "id-ID" } = props;
  const [now, setNow] = useState(new Date());
  const [userName, setUserName] = useState(name ?? null);

  // Ambil nama user dari /auth/me (struktur: { user: {...} })
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (userName) return;
      try {
        const res = await api.get("/auth/me");
        const u = res?.data?.user;
        const n = u?.nama ?? u?.name ?? u?.student?.namaLengkap ?? null;
        if (mounted && n) setUserName(n);
      } catch (e) {
        // biarin kosong → fallback ke "!"
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userName]);

  // Ticker jam realtime
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { text, Icon, accent } = useMemo(
    () => getGreeting(now.getHours()),
    [now]
  );

  const displayName = userName ? `, ${userName}` : "!";
  const dateStr = formatDate(now, locale);
  const timeStr = formatTime(now, locale);

  return (
    <Card className="border-0 bg-gradient-to-r from-slate-50 to-white shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-slate-100 p-3">
            <Icon className={`h-6 w-6 ${accent}`} />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {text}
              {displayName}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Semoga harimu lancar. Jangan lupa isi presensi ya ✍️
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5">
                <CalendarDays className="h-4 w-4" />
                <span className="font-medium">{dateStr}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5">
                <Clock className="h-4 w-4" />
                <span className="tabular-nums font-medium">{timeStr} WIB</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
