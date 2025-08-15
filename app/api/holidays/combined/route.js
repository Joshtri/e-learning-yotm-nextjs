// app/api/holidays/combined/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Holidays from "date-holidays";

const pad2 = (n) => String(n).padStart(2, "0");
const toISO = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function clipToYearRange(startDate, endDate, year) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end)) return [null, null];
  const yStart = new Date(year, 0, 1);
  const yEnd = new Date(year, 11, 31);
  return [start < yStart ? yStart : start, end > yEnd ? yEnd : end];
}

function expandRangeToYear(startDate, endDate, year) {
  const [s, e] = clipToYearRange(startDate, endDate, year);
  if (!s || !e || s > e) return [];
  const out = [];
  const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  while (cur <= e) {
    out.push(toISO(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function expandWeeklyToYear(dayOfWeek, year) {
  const out = [];
  let cur = new Date(year, 0, 1);
  // ke DOW pertama
  const delta = (dayOfWeek - cur.getDay() + 7) % 7;
  cur.setDate(cur.getDate() + delta);
  while (cur.getFullYear() === year) {
    out.push(toISO(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return out;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;
    const year =
      Number(url.searchParams.get("year")) || new Date().getFullYear();
    const monthParam = url.searchParams.get("month");
    const month = monthParam ? Number(monthParam) : null; // 1..12 (opsional)

    // 1) Libur nasional (Indonesia) via date-holidays
    const hd = new Holidays("ID");
    hd.setLanguages("id");
    const national = (hd.getHolidays(year) || [])
      .filter((h) => !h.substitute && (!h.type || h.type === "public"))
      .map((h) => ({
        date: h.date.slice(0, 10),
        name: h.name,
        source: "national",
      }));

    // Helper fetch ke API internal (biar aman kalau endpoint belum ada, tetap lanjut)
    const safeJson = async (path) => {
      try {
        const res = await fetch(`${origin}${path}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const j = await res.json();
        return j?.data || [];
      } catch {
        return [];
      }
    };

    // 2) Custom dari DB (rentang/harian/mingguan)
    const [ranges, days, weekly] = await Promise.all([
      safeJson("/api/holidays/ranges"),
      safeJson("/api/holidays/days"),
      safeJson("/api/holidays/weekly"), // opsional; kalau belum ada akan kosong
    ]);

    const windowStart = month
      ? new Date(year, month - 1, 1)
      : new Date(year, 0, 1);
    const windowEnd = month ? new Date(year, month, 0) : new Date(year, 11, 31);

    // Expand rentang
    const rangeItems = [];
    for (const r of ranges) {
      const start = r.startDate || r.tanggalMulai;
      const end = r.endDate || r.tanggalSelesai;
      for (const iso of expandRangeToYear(start, end, year)) {
        const d = new Date(iso);
        if (d >= windowStart && d <= windowEnd) {
          rangeItems.push({
            date: iso,
            name: r.nama || "Libur",
            source: "range",
          });
        }
      }
    }

    // Harian
    const dayItems = [];
    for (const d of days) {
      const iso = toISO(new Date(d.tanggal || d.date));
      const dd = new Date(iso);
      if (dd.getFullYear() === year && dd >= windowStart && dd <= windowEnd) {
        dayItems.push({
          date: iso,
          name: d.reason || d.nama || "Libur Harian",
          source: "day",
        });
      }
    }

    // Mingguan (berulang)
    const weeklyItems = [];
    for (const w of weekly) {
      const dow = Number(w.dayOfWeek);
      if (!Number.isInteger(dow) || dow < 0 || dow > 6) continue;
      for (const iso of expandWeeklyToYear(dow, year)) {
        const dd = new Date(iso);
        if (dd >= windowStart && dd <= windowEnd) {
          weeklyItems.push({
            date: iso,
            name: w.reason || "Libur Mingguan",
            source: "weekly",
          });
        }
      }
    }

    // Merge & filter bulan (jika ada)
    let data = [...national, ...rangeItems, ...dayItems, ...weeklyItems];
    if (month) {
      const prefix = `${year}-${pad2(month)}`;
      data = data.filter((x) => x.date.startsWith(prefix));
    }

    // sort & dedupe
    data.sort(
      (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name)
    );
    const unique = data.filter(
      (v, i, a) =>
        a.findIndex(
          (t) => t.date === v.date && t.name === v.name && t.source === v.source
        ) === i
    );

    return NextResponse.json({
      success: true,
      year,
      month: month ?? null,
      count: unique.length,
      data: unique,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
