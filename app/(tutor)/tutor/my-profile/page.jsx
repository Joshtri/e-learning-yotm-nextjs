"use client";

import { useEffect, useState } from "react";
import ProfileCard from "@/components/Profile/ProfileCard";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {
        console.log("Error fetching user data");
      });
  }, [refreshKey]);

  const handleEdit = () => {
    // Refresh data setelah edit
    setRefreshKey((prev) => prev + 1);
  };

  const handleLogout = () => {
    // delete cookie logic here
    document.cookie = "auth_token=; Max-Age=0; path=/; SameSite=Strict; secure;";
    window.location.href = "/login";
  };

  return <ProfileCard user={user} onEdit={handleEdit} onLogout={handleLogout} />;
}
