"use client";

import { useEffect, useState } from "react";
import ProfileCard from "@/components/Profile/ProfileCard";

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {
        console.log("Error fetching user data");
      });
  }, []);

  const handleEdit = () => {
    console.log("Redirect to edit profile");
  };

  const handleLogout = () => {
    // delete cookie logic here
    window.location.href = "/login";
  };

  return <ProfileCard user={user} onEdit={handleEdit} onLogout={handleLogout} />;
}
