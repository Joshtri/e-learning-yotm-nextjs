"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NewChatDialog } from "./NewChatDialog";

export function ChatSidebar({
  isOpen,
  onToggle,
  selectedUserId,
  onSelectUser,
  className,
  currentUserRole = "TUTOR",
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["chat-rooms"],
    queryFn: async () => {
      const res = await axios.get("/api/chat/rooms");
      return res.data.data;
    },
  });

const filteredRooms = React.useMemo(() => {
  if (!data) return [];

  return data.filter((room) => {
    const otherUser = room.users.find((u) => u.id !== selectedUserId);

    // Jika admin, tampilkan semua room
    if (currentUserRole === "ADMIN") return true;

    // Jika bukan admin, hanya tampilkan room yang relevan
    return (
      !searchQuery ||
      otherUser?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUser?.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
}, [data, searchQuery, selectedUserId, currentUserRole]);

  const handleCreateNewChat = (selectedUser) => {
    onSelectUser(selectedUser.id);
    setIsNewChatDialogOpen(false);
  };

  return (
    <div
      className={cn(
        "h-full border-r transition-all duration-300 ease-in-out",
        isOpen ? "w-full md:w-80" : "w-0 md:w-0",
        className
      )}
    >
      {isOpen && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Pesan</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsNewChatDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onToggle}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="relative p-3">
            <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari pengguna atau pesan..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-auto">
            <div className="space-y-1 p-2">
              {isLoading ? (
                <p className="text-muted-foreground text-sm px-3">Memuat...</p>
              ) : (
                filteredRooms.map((room) => {
                  const otherUser = room.users.find(
                    (u) => u.id !== selectedUserId
                  );
                  const lastMessage = room.messages[0];

                  return (
                    <button
                      key={room.id}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                        selectedUserId === otherUser?.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      )}
                      onClick={() => onSelectUser(room.id)} // ⬅️ gunakan room.id bukan user.id
                      >
                      <Avatar>
                        <AvatarImage
                          src="/placeholder.svg"
                          alt={otherUser.nama}
                        />
                        <AvatarFallback>
                          {otherUser.nama.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-medium">
                            {otherUser.nama}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {lastMessage
                              ? new Date(
                                  lastMessage.createdAt
                                ).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm text-muted-foreground">
                            {lastMessage?.content || "Belum ada pesan"}
                          </p>
                          {room.unreadCount > 0 && (
                            <Badge variant="default">{room.unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {otherUser.role}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <NewChatDialog
            open={isNewChatDialogOpen}
            onOpenChange={setIsNewChatDialogOpen}
            onCreateChat={handleCreateNewChat}
            currentUserRole={currentUserRole}
          />
        </div>
      )}
    </div>
  );
}
