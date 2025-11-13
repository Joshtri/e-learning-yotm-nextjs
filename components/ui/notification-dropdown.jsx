"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import api from "@/lib/axios";
import dayjs from "dayjs";
import { Badge } from "./badge";

// ✅ Cache configuration for notifications
const NOTIFICATION_CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes garbage collection (formerly cacheTime)
  refetchInterval: 30 * 1000, // Auto refetch every 30 seconds
  refetchIntervalInBackground: true, // Keep refetching even in background
};

export function NotificationDropdown({ userId }) {
  const queryClient = useQueryClient();

  // ✅ Fetch notifications with TanStack Query
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const res = await api.get(`/notifications?userId=${userId}`);
      return res.data.data || [];
    },
    enabled: !!userId, // Only run query if userId exists
    ...NOTIFICATION_CACHE_CONFIG,
  });

  // ✅ Mutation to mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.patch(`/notifications?id=${id}`);
    },
    onSuccess: () => {
      // ✅ Invalidate and refetch notifications after marking as read
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
    onError: (err) => {
      console.error("Gagal menandai sebagai dibaca:", err);
    },
  });

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-blue-400 text-white transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 min-w-[0.50rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px]">
        {notifications.length === 0 ? (
          <DropdownMenuItem className="text-sm text-muted-foreground">
            Tidak ada notifikasi
          </DropdownMenuItem>
        ) : (
          <>
            {notifications.map((notif, index) => {
              const isFirstRead =
                notif.isRead &&
                index > 0 &&
                notifications[index - 1]?.isRead === false;

              return (
                <div key={notif.id}>
                  {isFirstRead && (
                    <div className="border-t my-2 border-muted text-xs text-muted-foreground px-3 py-1">
                      <Badge variant="outline" className="text-blue-500">
                        Notifikasi Lama
                      </Badge>
                    </div>
                  )}

                  <DropdownMenuItem
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`flex flex-col items-start space-y-1 cursor-pointer transition-colors ${
                      !notif.isRead
                        ? "bg-primary/10 hover:bg-primary/20"
                        : "bg-background opacity-70 hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!notif.isRead && (
                        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                      )}
                      <span
                        className={`font-semibold ${
                          notif.isRead ? "font-normal" : ""
                        }`}
                      >
                        {notif.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {notif.message}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {dayjs(notif.createdAt).format("DD MMM YYYY HH:mm")}
                    </span>
                  </DropdownMenuItem>
                </div>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
