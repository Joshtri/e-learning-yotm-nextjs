"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import ProfileCard from "@/components/Profile/ProfileCard";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await axios.get("/api/auth/me", {
          withCredentials: true, // penting buat ambil cookie
        });

        if (res.data.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    getUser();
  }, [refreshKey]);

  const handleEdit = () => {
    // Refresh data setelah edit
    setRefreshKey((prev) => prev + 1);
  };

  const handleLogout = () => {
    // simple logout logic
    document.cookie =
      "auth_token=; Max-Age=0; path=/; SameSite=Strict; secure;";
    window.location.href = "/";
  };

  return <ProfileCard user={user} onEdit={handleEdit} onLogout={handleLogout} />;
}
