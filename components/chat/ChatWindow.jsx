"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatInput } from "./ChatInput";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

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
            <AvatarImage src="/placeholder.svg" alt="User" />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">Percakapan</h3>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Lihat profil</DropdownMenuItem>
              <DropdownMenuItem>Cari dalam percakapan</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Hapus percakapan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
