"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./ChatInput";

export function ChatWindow({ roomId, onBackClick, isMobileView, className }) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Ambil user login dari /auth/me
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        setCurrentUserId(res.data.user?.id || null);
      } catch (err) {
        console.error("Gagal ambil user login:", err);
      }
    };
    fetchUser();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["chatMessages", roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const res = await axios.get("/api/chat/messages?roomId=" + roomId);
      return res.data.data;
    },
  });

  // Ambil info room untuk mendapatkan detail penerima pesan
  const { data: roomData } = useQuery({
    queryKey: ["chatRoom", roomId],
    enabled: !!roomId && !!currentUserId,
    queryFn: async () => {
      const res = await axios.get("/api/chat/rooms");
      const rooms = res.data.data;
      return rooms.find((r) => r.id === roomId);
    },
  });

  // Cari user lawan bicara (bukan current user)
  const otherUser = roomData?.users?.find((u) => u.id !== currentUserId);

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const res = await axios.post("/api/chat/messages", { roomId, content });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages", roomId] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data]);

  const handleSendMessage = (content) => {
    if (content.trim()) {
      sendMessageMutation.mutate(content);
    }
  };

  if (!roomId || !currentUserId) {
    return (
      <div
        className={cn(
          "flex h-full flex-1 items-center justify-center bg-muted/10",
          isMobileView && !roomId ? "hidden" : "flex",
          className
        )}
      >
        <div className="text-center">
          <h3 className="text-lg font-medium">Pilih percakapan</h3>
          <p className="text-sm text-muted-foreground">
            Pilih pengguna dari daftar untuk memulai percakapan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-1 flex-col",
        isMobileView && !roomId ? "hidden" : "flex",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          {isMobileView && (
            <Button variant="ghost" size="icon" onClick={onBackClick}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Kembali</span>
            </Button>
          )}
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt={otherUser?.nama || "User"} />
            <AvatarFallback>
              {otherUser?.nama?.substring(0, 2).toUpperCase() || "US"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">
              {otherUser?.nama || "Percakapan"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {otherUser?.role || "Online"}
            </p>
          </div>
        </div>

      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat pesan...</p>
          ) : (
            data?.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    isOwnMessage ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex gap-2",
                      isOwnMessage && "flex-row-reverse"
                    )}
                  >
                    {!isOwnMessage && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src="/placeholder.svg"
                          alt={message.sender.nama}
                        />
                        <AvatarFallback>
                          {message.sender.nama?.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div
                        className={cn(
                          "max-w-md px-4 py-2 text-sm whitespace-pre-wrap break-words shadow-sm",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-none"
                            : "bg-muted text-foreground rounded-2xl rounded-bl-none"
                        )}
                      >
                        {message.content}
                      </div>
                      <p
                        className={cn(
                          "mt-1 text-xs text-muted-foreground",
                          isOwnMessage ? "text-right" : ""
                        )}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
