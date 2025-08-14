"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import dayjs from "dayjs";

// Opsi hari (untuk libur mingguan berulang via API kamu)
const WEEK_OPTIONS = [
  { value: 0, label: "Minggu" },
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
];

// Expand rentang (inklusif) menjadi daftar tanggal ISO
function expandRange(start, end, monthStartISO, monthEndISO) {
  if (!start || !end) return [];
  let cur = dayjs(start);
  const last = dayjs(end);
  const out = [];
  while (cur.isSameOrBefore(last, "day")) {
    const iso = cur.format("YYYY-MM-DD");
    if (!monthStartISO || (iso >= monthStartISO && iso <= monthEndISO)) {
      out.push(iso);
    }
    cur = cur.add(1, "day");
  }
  return out;
}

// Expand aturan mingguan berulang untuk bulan+tahun aktif
function expandWeeklyRule(dayOfWeek, month, year) {
  const first = dayjs().year(year).month(month).date(1);
  const last = first.endOf("month");
  let cur = first.add((dayOfWeek - first.day() + 7) % 7, "day");
  const out = [];
  while (cur.isSameOrBefore(last, "day")) {
    out.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(7, "day");
  }
  return out;
}

export default function HolidayManagementPage() {
  // === STATE FORM/DAFTAR (punya kamu) ===
  const [ranges, setRanges] = useState([]);
  const [newRange, setNewRange] = useState({
    nama: "",
    tanggalMulai: "",
    tanggalSelesai: "",
  });

  const [days, setDays] = useState([]);
  const [newDay, setNewDay] = useState({ tanggal: "", reason: "" });

  // (opsional) libur mingguan berulang dari API kamu
  const [weekly, setWeekly] = useState([]);
  const [newWeekly, setNewWeekly] = useState({ dayOfWeek: 5, reason: "" });

  // === STATE LIBUR NASIONAL (date-holidays) ===
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()); // 0..11
  const [national, setNational] = useState([]); // {date: 'YYYY-MM-DD', name: '...'}

  const [loadingNational, setLoadingNational] = useState(false);
  const [errorNational, setErrorNational] = useState(null);

  // === FETCHERS ===
  const fetchRanges = async () => {
    try {
      const res = await api.get("/holidays/ranges");
      setRanges(res.data?.data || []);
    } catch {
      toast.error("Gagal memuat data libur rentang");
    }
  };

  const fetchDays = async () => {
    try {
      const res = await api.get("/holidays/days");
      setDays(res.data?.data || []);
    } catch {
      toast.error("Gagal memuat libur harian");
    }
  };

  const fetchWeekly = async () => {
    try {
      const res = await api.get("/holidays/weekly"); // siapkan endpoint ini di backend kamu
      setWeekly(res.data?.data || []);
    } catch {
      // tidak fatal kalau belum ada
      setWeekly([]);
    }
  };

  // ambil libur nasional dari endpoint kamu: /api/date-holidays?year=YYYY
  const fetchNational = async () => {
    try {
      setLoadingNational(true);
      const res = await fetch(`/api/date-holidays?year=${year}`);
      const json = await res.json();
      if (!json.success)
        throw new Error(json.message || "Gagal memuat libur nasional");
      // Normalisasi ke { date: 'YYYY-MM-DD', name: '...' }
      const items = (json.data || []).map((h) => ({
        date: (h.date || "").slice(0, 10),
        name: h.name || h.title || "Holiday",
        _source: "national",
      }));
      setNational(items);
      setErrorNational(null);
    } catch (e) {
      setErrorNational(e?.message || "Gagal memuat libur nasional");
      setNational([]);
    } finally {
      setLoadingNational(false);
    }
  };

  // === CRUD ===
  const handleAddRange = async () => {
    const { nama, tanggalMulai, tanggalSelesai } = newRange;
    if (!nama || !tanggalMulai || !tanggalSelesai)
      return toast.error("Nama & tanggal wajib diisi");
    try {
      await api.post("/holidays/ranges", {
        nama,
        tanggalMulai,
        tanggalSelesai,
      });
      toast.success("Berhasil menambahkan libur rentang");
      setNewRange({ nama: "", tanggalMulai: "", tanggalSelesai: "" });
      fetchRanges();
    } catch {
      toast.error("Gagal menambah libur rentang");
    }
  };

  const handleDeleteRange = async (id) => {
    try {
      await api.delete(`/holidays/ranges/${id}`);
      toast.success("Libur rentang dihapus");
      fetchRanges();
    } catch {
      toast.error("Gagal menghapus libur rentang");
    }
  };

  const handleAddDay = async () => {
    const { tanggal, reason } = newDay;
    if (!tanggal || !reason)
      return toast.error("Tanggal dan alasan wajib diisi");
    try {
      await api.post("/holidays/days", { tanggal, reason });
      toast.success("Hari libur harian ditambahkan");
      setNewDay({ tanggal: "", reason: "" });
      fetchDays();
    } catch {
      toast.error("Gagal menambahkan hari libur harian");
    }
  };

  const handleDeleteDay = async (id) => {
    try {
      await api.delete(`/holidays/days?id=${id}`);
      toast.success("Hari libur harian dihapus");
      fetchDays();
    } catch {
      toast.error("Gagal menghapus libur harian");
    }
  };

  const handleAddWeekly = async () => {
    const { dayOfWeek, reason } = newWeekly;
    if (!reason.trim()) return toast.error("Alasan libur mingguan wajib diisi");
    try {
      await api.post("/holidays/weekly", {
        dayOfWeek: Number(dayOfWeek),
        reason,
      });
      toast.success("Libur mingguan ditambahkan");
      setNewWeekly({ dayOfWeek: 5, reason: "" });
      fetchWeekly();
    } catch {
      toast.error("Gagal menambahkan libur mingguan");
    }
  };

  const handleDeleteWeekly = async (id) => {
    try {
      await api.delete(`/holidays/weekly?id=${id}`);
      toast.success("Libur mingguan dihapus");
      fetchWeekly();
    } catch {
      toast.error("Gagal menghapus libur mingguan");
    }
  };

  // === INITIAL LOAD ===
  useEffect(() => {
    fetchRanges();
    fetchDays();
    fetchWeekly();
  }, []);

  // === LOAD NATIONAL WHEN YEAR CHANGES ===
  useEffect(() => {
    fetchNational();
  }, [year]);

  // === WINDOW (bulan aktif) ===
  const monthStartISO = useMemo(
    () => dayjs().year(year).month(month).date(1).format("YYYY-MM-DD"),
    [year, month]
  );
  const monthEndISO = useMemo(
    () => dayjs().year(year).month(month).endOf("month").format("YYYY-MM-DD"),
    [year, month]
  );

  // === KOMBINASI FINAL PER-HARI UNTUK BULAN AKTIF ===
  // hasil: [{ date: 'YYYY-MM-DD', items: [{ source, name }] }]
  const combinedByDate = useMemo(() => {
    const map = new Map();

    // 1) libur nasional (harian dari date-holidays)
    for (const h of national) {
      if (!h.date) continue;
      if (h.date < monthStartISO || h.date > monthEndISO) continue;
      const cur = map.get(h.date) || { date: h.date, items: [] };
      cur.items.push({ source: "national", name: h.name });
      map.set(h.date, cur);
    }

    // 2) libur rentang → expand ke per-hari (dalam bulan)
    for (const r of ranges) {
      const start = r.startDate || r.tanggalMulai;
      const end = r.endDate || r.tanggalSelesai;
      const dates = expandRange(start, end, monthStartISO, monthEndISO);
      for (const iso of dates) {
        const cur = map.get(iso) || { date: iso, items: [] };
        cur.items.push({ source: "range", name: r.nama || "Libur" });
        map.set(iso, cur);
      }
    }

    // 3) libur harian (custom)
    for (const d of days) {
      const iso = (d.tanggal || d.date || "").slice(0, 10);
      if (!iso) continue;
      if (iso < monthStartISO || iso > monthEndISO) continue;
      const cur = map.get(iso) || { date: iso, items: [] };
      cur.items.push({
        source: "day",
        name: d.reason || d.nama || "Libur Harian",
      });
      map.set(iso, cur);
    }

    // 4) libur mingguan (berulang) → expand ke per-hari (dalam bulan)
    for (const w of weekly) {
      const list = expandWeeklyRule(Number(w.dayOfWeek), month, year);
      for (const iso of list) {
        if (iso < monthStartISO || iso > monthEndISO) continue;
        const cur = map.get(iso) || { date: iso, items: [] };
        cur.items.push({
          source: "weekly",
          name: w.reason || "Libur Mingguan",
        });
        map.set(iso, cur);
      }
    }

    // sort by date & dedupe items per date
    const out = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
    out.forEach((row) => {
      const seen = new Set();
      row.items = row.items.filter((it) => {
        const key = `${it.source}::${it.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
    return out;
  }, [national, ranges, days, weekly, monthStartISO, monthEndISO, month, year]);

  // === UI controls ===
  const years = Array.from(
    { length: 7 },
    (_, i) => new Date().getFullYear() - 3 + i
  );
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      {/* Header - Periode Kalender (Full Width) */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Periode Kalender</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Tahun</label>
                <select
                  className="border rounded-md px-3 py-2 min-w-[100px]"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Bulan</label>
                <select
                  className="border rounded-md px-3 py-2 min-w-[120px]"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={prevMonth} variant="outline" size="sm">
                ← Prev
              </Button>
              <Button onClick={nextMonth} variant="outline" size="sm">
                Next →
              </Button>
              <Button
                onClick={fetchNational}
                disabled={loadingNational}
                size="sm"
              >
                {loadingNational ? "Loading..." : "Refresh Nasional"}
              </Button>
              {errorNational && (
                <span className="text-sm text-red-600">{errorNational}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Layout - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Forms */}
        <div className="space-y-6">
          {/* Form Libur Rentang */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tambah Libur Rentang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Nama Libur"
                value={newRange.nama}
                onChange={(e) =>
                  setNewRange({ ...newRange, nama: e.target.value })
                }
              />
              <Input
                type="date"
                value={newRange.tanggalMulai}
                onChange={(e) =>
                  setNewRange({ ...newRange, tanggalMulai: e.target.value })
                }
              />
              <Input
                type="date"
                value={newRange.tanggalSelesai}
                onChange={(e) =>
                  setNewRange({ ...newRange, tanggalSelesai: e.target.value })
                }
              />
              <Button onClick={handleAddRange} className="w-full">
                Tambah Libur Rentang
              </Button>
            </CardContent>
          </Card>

          {/* Form Libur Harian */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tambah Libur Harian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Alasan libur"
                value={newDay.reason}
                onChange={(e) =>
                  setNewDay({ ...newDay, reason: e.target.value })
                }
              />
              <Input
                type="date"
                value={newDay.tanggal}
                onChange={(e) =>
                  setNewDay({ ...newDay, tanggal: e.target.value })
                }
              />
              <Button onClick={handleAddDay} className="w-full">
                Tambah Hari Libur
              </Button>
            </CardContent>
          </Card>

          {/* Form Libur Mingguan */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Libur Mingguan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                className="w-full border rounded-md px-3 py-2"
                value={newWeekly.dayOfWeek}
                onChange={(e) =>
                  setNewWeekly({
                    ...newWeekly,
                    dayOfWeek: Number(e.target.value),
                  })
                }
              >
                {WEEK_OPTIONS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Alasan (mis. Kegiatan sekolah tiap Jumat)"
                value={newWeekly.reason}
                onChange={(e) =>
                  setNewWeekly({ ...newWeekly, reason: e.target.value })
                }
              />
              <Button onClick={handleAddWeekly} className="w-full">
                Tambah Libur Mingguan
              </Button>

              {/* List Mingguan */}
              {weekly.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Daftar:
                  </div>
                  {weekly.slice(0, 3).map((w) => (
                    <div
                      key={w.id}
                      className="flex justify-between items-start text-sm bg-gray-50 p-2 rounded"
                    >
                      <div>
                        <div className="font-medium">
                          {WEEK_OPTIONS.find(
                            (o) => o.value === Number(w.dayOfWeek)
                          )?.label || `DOW ${w.dayOfWeek}`}
                        </div>
                        <div className="text-gray-600 text-xs truncate">
                          {w.reason}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteWeekly(w.id)}
                        className="text-xs px-2 py-1 h-6"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {weekly.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{weekly.length - 3} lainnya...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Lists & Combined View */}
        <div className="space-y-6">
          <div className="xl:col-span-1">
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  Kalender Libur - {months[month]} {year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[600px] overflow-y-auto space-y-3">
                  {combinedByDate.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-2xl mb-2">📅</div>
                      <p className="text-sm">
                        Tidak ada libur pada {months[month]} {year}
                      </p>
                    </div>
                  ) : (
                    combinedByDate.map((row) => (
                      <div
                        key={row.date}
                        className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="font-medium text-gray-800 mb-2">
                          {dayjs(row.date).format("DD MMM YYYY")}
                          <span className="text-sm text-gray-500 ml-2">
                            ({dayjs(row.date).format("dddd")})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {row.items.map((s, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-1 rounded-full border font-medium ${
                                s.source === "national"
                                  ? "bg-rose-50 border-rose-200 text-rose-700"
                                  : s.source === "range"
                                  ? "bg-amber-50 border-amber-200 text-amber-700"
                                  : s.source === "day"
                                  ? "bg-blue-50 border-blue-200 text-blue-700"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
                              }`}
                              title={s.name}
                            >
                              {s.name.length > 20
                                ? `${s.name.slice(0, 20)}...`
                                : s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Daftar Libur Rentang */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Daftar Libur Rentang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {ranges.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Belum ada libur rentang
                  </p>
                ) : (
                  ranges.map((item) => (
                    <div
                      key={item.id}
                      className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-amber-800 truncate">
                            {item.nama}
                          </div>
                          <div className="text-sm text-amber-600 mt-1">
                            {dayjs(item.startDate || item.tanggalMulai).format(
                              "DD MMM"
                            )}{" "}
                            →{" "}
                            {dayjs(item.endDate || item.tanggalSelesai).format(
                              "DD MMM YYYY"
                            )}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRange(item.id)}
                          className="ml-2 text-xs px-2 py-1 h-6"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Daftar Libur Harian */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Daftar Libur Harian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {days.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Belum ada libur harian
                  </p>
                ) : (
                  days.map((item) => (
                    <div
                      key={item.id}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-blue-800 truncate">
                            {item.reason}
                          </div>
                          <div className="text-sm text-blue-600 mt-1">
                            {dayjs(item.tanggal || item.date).format(
                              "DD MMM YYYY"
                            )}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDay(item.id)}
                          className="ml-2 text-xs px-2 py-1 h-6"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Combined View */}
      </div>
    </div>
  );
}
