// app/admin/holidays/page.jsx
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import dayjs from "dayjs";

export default function HolidayManagementPage() {
  const [ranges, setRanges] = useState([]);
  const [newRange, setNewRange] = useState({
    nama: "",
    tanggalMulai: "",
    tanggalSelesai: "",
  });

  const [days, setDays] = useState([]);
  const [newDay, setNewDay] = useState({ tanggal: "", reason: "" });

  const fetchRanges = async () => {
    try {
      const res = await api.get("/holidays/ranges");
      setRanges(res.data.data);
    } catch (err) {
      toast.error("Gagal memuat data libur");
    }
  };

  const fetchDays = async () => {
    try {
      const res = await api.get("/holidays/days");
      setDays(res.data.data);
    } catch (err) {
      toast.error("Gagal memuat libur harian");
    }
  };

  const handleAdd = async () => {
    try {
      await api.post("/holidays/ranges", newRange);
      toast.success("Berhasil menambahkan hari libur");
      setNewRange({ nama: "", tanggalMulai: "", tanggalSelesai: "" });
      fetchRanges();
    } catch (err) {
      toast.error("Gagal menambah libur");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/holidays/ranges/${id}`);
      toast.success("Libur berhasil dihapus");
      fetchRanges();
    } catch (err) {
      toast.error("Gagal menghapus libur");
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
      toast.success("Hari libur dihapus");
      fetchDays();
    } catch {
      toast.error("Gagal menghapus libur");
    }
  };

  useEffect(() => {
    fetchRanges();
    fetchDays(); // tambahkan ini
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Hari Libur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Nama Libur"
            value={newRange.nama}
            onChange={(e) => setNewRange({ ...newRange, nama: e.target.value })}
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
          <Button onClick={handleAdd}>Tambah Libur</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Hari Libur</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {ranges.map((item) => (
              <li key={item.id} className="flex justify-between items-center">
                <div>
                  <strong>{item.nama}</strong> <br />
                  {dayjs(item.startDate).format("DD MMM YYYY")} →{" "}
                  {dayjs(item.endDate).format("DD MMM YYYY")}
                </div>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  Hapus
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Hari Libur Harian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Alasan libur"
            value={newDay.reason}
            onChange={(e) => setNewDay({ ...newDay, reason: e.target.value })}
          />
          <Input
            type="date"
            value={newDay.tanggal}
            onChange={(e) => setNewDay({ ...newDay, tanggal: e.target.value })}
          />
          <Button onClick={handleAddDay}>Tambah Hari Libur</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Hari Libur Harian</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {days.map((item) => (
              <li key={item.id} className="flex justify-between items-center">
                <div>
                  <strong>{item.reason}</strong> <br />
                  {dayjs(item.tanggal).format("DD MMM YYYY")}
                </div>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteDay(item.id)}
                >
                  Hapus
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
