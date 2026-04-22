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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ForumCreateForm from "@/components/forums/ForumCreateForm";
import { toast } from "sonner";

export default function TutorForumsPage() {
  const [forums, setForums] = useState([]);

  useEffect(() => {
    const fetchForums = async () => {
      const res = await axios.get("/forums?tutorView=true");
      setForums(res.data.data);
    };
    fetchForums();
  }, []);

  const handleToggleForum = async (forumId, currentClosed) => {
    try {
      const res = await axios.patch(`/forums/${forumId}`, {
        closed: !currentClosed,
      });
      if (res.data.success) {
        setForums((prev) =>
          prev.map((f) =>
            f.id === forumId ? { ...f, closed: !currentClosed } : f
          )
        );
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengubah status forum");
    }
  };

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
        <div
          key={forum.id}
          className="border p-4 mb-3 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50"
        >
          <div className="flex justify-between items-center">
            <Link
              href={`/tutor/discussions/${forum.id}`}
              className="flex-1"
            >
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
            </Link>
            <div className="flex items-center gap-3 ml-4">
              {forum.closed && (
                <span className="text-sm text-red-500 font-medium">
                  [Ditutup]
                </span>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={forum.closed ? "outline" : "destructive"}
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {forum.closed ? "Buka Kembali" : "Akhiri Forum"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {forum.closed ? "Buka Kembali Forum?" : "Akhiri Forum?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {forum.closed
                        ? "Forum akan dibuka kembali dan siswa dapat mengirim pesan."
                        : "Forum akan ditutup dan siswa tidak dapat mengirim pesan lagi."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleToggleForum(forum.id, forum.closed)}
                    >
                      {forum.closed ? "Buka Kembali" : "Akhiri Forum"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
