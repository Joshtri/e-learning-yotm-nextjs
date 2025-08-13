"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Sunrise, Sun, Sunset, Moon } from "lucide-react";

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
  if (hour >= 4 && hour < 10) return { text: "Pagi", Icon: Sunrise };
  if (hour >= 10 && hour < 15) return { text: "Siang", Icon: Sun };
  if (hour >= 15 && hour < 18) return { text: "Sore", Icon: Sunset };
  return { text: "Malam", Icon: Moon };
}

export default function HeaderDateTimeWidget({
  locale = "id-ID",
  tzLabel = "WIB",
}) {
  const [now, setNow] = useState(new Date());

  // realtime tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = useMemo(() => formatDate(now, locale), [now, locale]);
  const timeStr = useMemo(() => formatTime(now, locale), [now, locale]);
  const { text: greet, Icon } = useMemo(
    () => getGreeting(now.getHours()),
    [now]
  );

  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-white/15 px-3 py-2 backdrop-blur-md ring-1 ring-white/20 text-white shadow-sm
                    dark:bg-black/20 dark:ring-white/10"
    >
      {/* greet bubble (mobile-hide) */}
      <span className="hidden sm:flex items-center gap-1.5 rounded-lg bg-white/20 px-2 py-1 text-xs font-medium ring-1 ring-white/25">
        <Icon className="h-4 w-4" />
        <span>Selamat {greet}</span>
      </span>

      {/* date */}
      <span className="inline-flex items-center gap-1.5 text-sm">
        <CalendarDays className="h-4 w-4 opacity-90" />
        <span className="font-medium">{dateStr}</span>
      </span>

      {/* separator */}
      <span className="h-4 w-px bg-white/30 hidden sm:block" />

      {/* time */}
      <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
        <Clock className="h-4 w-4 opacity-90" />
        <span className="font-semibold">{timeStr}</span>
        <span className="text-white/80 text-xs">{tzLabel}</span>
      </span>
    </div>
  );
}
