"use client";

import { ChatLayout } from "@/components/chat/ChatLayout";

export default function MessagesPage() {
  return (
    <div className="container p-4">
      <h1 className="mb-4 text-2xl font-bold">Pesan</h1>
      {/* 
        Anda dapat mengubah currentUserRole sesuai dengan peran pengguna saat ini:
        - "Tutor" untuk guru
        - "Siswa" untuk siswa
        - "Wali Kelas" untuk wali kelas
      */}
      <ChatLayout currentUserRole="Tutor" />
    </div>
  );
}
