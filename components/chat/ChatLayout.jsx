"use client";

import React from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";

/**
 * @param {Object} props
 * @param {string} [props.className]
 * @param {string} [props.defaultSelectedUserId]
 * @param {string} [props.currentUserRole="Tutor"] - Role of the current user
 */
export function ChatLayout({
  className,
  defaultSelectedUserId,
  currentUserRole = "TUTOR",
}) {
  const [selectedUserId, setSelectedUserId] = React.useState(
    defaultSelectedUserId || null
  );
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(!isMobile);

  // Handle sidebar toggle on mobile
  React.useEffect(() => {
    if (isMobile) {
      // Close sidebar when a chat is selected on mobile
      if (selectedUserId) {
        setIsSidebarOpen(false);
      }
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile, selectedUserId]);

  return (
    <div
      className={cn(
        "flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg border",
        className
      )}
    >
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        selectedUserId={selectedUserId}
        
        onSelectUser={setSelectedUserId}
        currentUserRole={currentUserRole}
      />
      <ChatWindow
        // userId={selectedUserId}
        roomId={selectedUserId}

        onBackClick={() => setIsSidebarOpen(true)}
        isMobileView={isMobile}
      />
    </div>
  );
}

export default ChatLayout;
