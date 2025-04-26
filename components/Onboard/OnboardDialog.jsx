"use client";

import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import axios from "axios";
import { useEffect, useState } from "react";
import StudentForm from "@/components/Onboard/FormStudent";
import { FormTutor } from "@/components/Onboard/FormTutor";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function OnboardingDialog({ user }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.id || !user?.role) return;

    let interval;

    const simulateProgress = () => {
      let value = 0;
      interval = setInterval(() => {
        value += Math.random() * 10;
        if (value >= 95) return;
        setProgress(Math.floor(value));
      }, 200);
    };

    const checkProfile = async () => {
      simulateProgress();
      try {
        const res = await axios.post("/api/users/check-profile", {
          userId: user.id,
          role: user.role,
        });
        const data = res.data;
        if (!data.hasProfile) {
          setOpen(true);
        }
      } catch (err) {
        console.error("Gagal mengecek profil:", err);
      } finally {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setLoading(false), 300);
      }
    };

    checkProfile();

    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <FullScreenLoader progress={progress} />;

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lengkapi Profil Anda</DialogTitle>
          <DialogDescription>
            Data ini diperlukan agar Anda bisa menggunakan platform dengan baik.
          </DialogDescription>
        </DialogHeader>

        {user?.role === "STUDENT" && (
          <StudentForm userId={user.id} onSuccess={() => setOpen(false)} />
        )}
        {user?.role === "TUTOR" && (
          <FormTutor userId={user.id} onSuccess={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
