"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ForumDetailPage() {
  const { id } = useParams();
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  // Ambil user dari /auth/me
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/auth/me");
        setCurrentUserId(res.data.user?.id || null);
      } catch (error) {
        console.error("Gagal mengambil user login:", error);
      }
    };
    fetchUser();
  }, []);

  // Query pesan
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["forum-messages", id],
    queryFn: async () => {
      const res = await axios.get(`/forums/${id}/messages`);
      return res.data.data;
    },
    refetchInterval: 5000,
  });

  const { mutate: sendMessage, isLoading: sending } = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`/forums/${id}/messages`, {
        content: message,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["forum-messages", id]);
      setMessage("");
      scrollToBottom();
    },
  });

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && message.trim()) {
      e.preventDefault();
      sendMessage();
    }
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4 border-b pb-3">
        <h1 className="text-xl font-bold">Forum Diskusi</h1>
        <div className="text-sm text-muted-foreground">
          {messages.length} pesan
        </div>
      </div>

      <div className="border rounded-lg h-[calc(100vh-220px)] overflow-y-auto bg-muted/30 p-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>Belum ada pesan dalam forum ini.</p>
            <p className="text-sm">
              Mulai diskusi dengan mengirim pesan pertama!
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted"></div>
                </div>
                <div className="relative bg-muted px-3 py-1 text-xs rounded-full text-muted-foreground">
                  {date === new Date().toLocaleDateString() ? "Hari ini" : date}
                </div>
              </div>

              {dateMessages.map((msg) => {
                const isMine = String(msg.sender?.id) === String(currentUserId);
                const time = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isMine && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage
                          src={`/placeholder.svg?text=${
                            msg.sender?.nama?.charAt(0) || "U"
                          }`}
                        />
                        <AvatarFallback>
                          {msg.sender?.nama?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`flex flex-col ${
                        isMine ? "items-end ml-auto" : "items-start mr-auto"
                      } max-w-[75%]`}
                    >
                      <div className="flex gap-2 mb-1 text-xs text-muted-foreground">
                        <span className="font-semibold">
                          {isMine ? "Anda" : msg.sender?.nama || "Pengguna"}
                        </span>
                        <span>({msg.sender?.role})</span>
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-2 whitespace-pre-wrap break-words ${
                          isMine
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-secondary text-secondary-foreground rounded-tl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {time}
                      </div>
                    </div>

                    {isMine && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage
                          src={`/placeholder.svg?text=${
                            msg.sender?.nama?.charAt(0) || "U"
                          }`}
                        />
                        <AvatarFallback>
                          {msg.sender?.nama?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan..."
            className="min-h-[80px] resize-none pr-12"
          />
          <Button
            onClick={() => message.trim() && sendMessage()}
            disabled={sending || !message.trim()}
            size="icon"
            className="absolute bottom-2 right-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Kirim</span>
          </Button>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground text-center">
        Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
      </div>
    </div>
  );
}
