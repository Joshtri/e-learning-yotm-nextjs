"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import ForumCreateForm from "@/components/forums/ForumCreateForm";

export default function TutorForumsPage() {
  const [forums, setForums] = useState([]);

  useEffect(() => {
    const fetchForums = async () => {
      const res = await axios.get("/forums?tutorView=true");
      setForums(res.data.data);
    };
    fetchForums();
  }, []);

  return (
    <div className="container p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Forum Diskusi</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>+ Buat Forum</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Buat Forum Diskusi</DialogTitle>
            <ForumCreateForm
              onSuccess={(newForum) => setForums((prev) => [newForum, ...prev])}
            />
          </DialogContent>
        </Dialog>
      </div>

      {forums.map((forum) => (
        <Link
          key={forum.id}
          href={`/tutor/discussions/${forum.id}`}
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
                Kelas: {forum.classSubjectTutor?.class?.namaKelas} -{" "}
                {forum.classSubjectTutor?.subject?.namaMapel}
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
      ))}
    </div>
  );
}
