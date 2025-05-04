"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";

export default function StudentForumsPage() {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForums = async () => {
      try {
        const res = await axios.get("/forums");
        setForums(res.data.data);   
      } catch (err) {
        console.error("Gagal memuat forum:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchForums();
  }, []);

  return (
    <div className="container p-4">
      <h1 className="text-2xl font-bold mb-4">Forum Diskusi Siswa</h1>

      {loading ? (
        <p>Memuat forum...</p>
      ) : forums.length === 0 ? (
        <p>Tidak ada forum yang tersedia.</p>
      ) : (
        forums.map((forum) => (
          <Link
            key={forum.id}
            href={`/siswa/discussions/${forum.id}`}
            className="block border p-4 mb-3 rounded hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">{forum.name}</h2>
                <p className="text-sm text-gray-500">
                  Dibuat oleh:{" "}
                  <span className="font-medium">{forum.createdBy?.nama}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Tanggal: {new Date(forum.createdAt).toLocaleString()}
                </p>
              </div>
              {forum.closed && (
                <span className="text-sm text-red-500 font-medium">
                  [Ditutup]
                </span>
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
