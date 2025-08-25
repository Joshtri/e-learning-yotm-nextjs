"use client";

import { ChevronDown, ChevronRight, LogOut, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { navByRole } from "@/config/navigation";
import { cn } from "@/lib/utils";

const NavGroup = ({ group, isOpen, expandedGroups, toggleGroup }) => {
  const pathname = usePathname();
  const isGroupExpanded = expandedGroups[group.title];

  return (
    <div className="mb-3">
      {group.title !== "Dashboard" && (
        <div
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-blue-200 cursor-pointer hover:text-white transition-colors"
          onClick={() => toggleGroup(group.title)}
        >
          <span className={cn(isOpen ? "opacity-100" : "opacity-0 md:hidden")}>
            {group.title}
          </span>
          {isOpen && (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isGroupExpanded ? "rotate-180" : ""
              )}
            />
          )}
        </div>
      )}
      <div
        className={cn(
          "space-y-1",
          group.title !== "Dashboard" && !isGroupExpanded && isOpen
            ? "hidden"
            : "block"
        )}
      >
        {group.items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className={cn(
                "justify-start w-full transition-all duration-200 hover:bg-blue-500/20 hover:text-white text-blue-100",
                isActive &&
                  "bg-blue-400/30 text-white font-semibold border-r-2 border-blue-300"
              )}
            >
              <Link href={item.href} className="flex items-center gap-3 w-full">
                <span
                  className={cn("transition-colors", isActive && "text-white")}
                >
                  {item.icon}
                </span>
                <span
                  className={cn(
                    "transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 md:hidden"
                  )}
                >
                  {item.title}
                </span>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export function AppSidebar({
  role,
  isOpen,
  onToggleSidebar,
  isMobile,
  onClose,
}) {
  const navigationGroups = navByRole[role] || [];

  const [expandedGroups, setExpandedGroups] = useState(
    Object.fromEntries(navigationGroups.map((g) => [g.title, true]))
  );

  const toggleGroup = (title) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const baseHref =
    role === "admin" ? "/admin" : role === "tutor" ? "/tutor" : "/siswa";

  if (isMobile && isOpen) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
        <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-blue-600 to-blue-700">
          <SidebarHeader href={baseHref} onClose={onClose} />
          <SidebarNav
            groups={navigationGroups}
            isOpen
            toggleGroup={toggleGroup}
            expandedGroups={expandedGroups}
          />
          <SidebarFooter role={role} isOpen />
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden md:flex md:flex-col bg-gradient-to-b from-blue-600 to-blue-700 transition-all h-screen shadow-xl",
        isOpen ? "md:w-64" : "md:w-16"
      )}
    >
      <SidebarHeader
        href={baseHref}
        onToggleSidebar={onToggleSidebar}
        isOpen={isOpen}
      />
      <SidebarNav
        groups={navigationGroups}
        isOpen={isOpen}
        toggleGroup={toggleGroup}
        expandedGroups={expandedGroups}
      />
      <SidebarFooter role={role} isOpen={isOpen} />
    </aside>
  );
}

function SidebarHeader({ href, onClose, onToggleSidebar, isOpen = true }) {
  return (
    <div className="border-b border-blue-500/30 px-3 py-4 h-16 flex items-center justify-between">
      <Link href="#" className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
          <span className="text-sm font-bold text-white drop-shadow-sm">
            YOT
          </span>
        </div>
        <span
          className={cn(
            "font-bold text-white drop-shadow-sm transition-opacity",
            isOpen ? "opacity-100" : "opacity-0 md:hidden"
          )}
        >
          Obor Timor Ministry
        </span>
      </Link>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      )}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 shadow-sm border border-white/20"
          title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          {isOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}

function SidebarNav({ groups, isOpen, toggleGroup, expandedGroups }) {
  return (
    <div className="flex-1 overflow-auto custom-scroll">
      <nav className="flex flex-col px-3 py-4">
        {groups.map((group) => (
          <NavGroup
            key={group.title}
            group={group}
            isOpen={isOpen}
            expandedGroups={expandedGroups}
            toggleGroup={toggleGroup}
          />
        ))}
      </nav>
    </div>
  );
}

function SidebarFooter({ role, isOpen }) {
  return (
    <div className="border-t border-blue-500/30 p-3">
      {role === "admin" && <></>}
      <Button
        variant="ghost"
        asChild
        className="justify-start w-full text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-colors"
      >
        <Link href="/login" className="flex items-center gap-3">
          <LogOut className="h-4 w-4" />
          <span
            className={cn(
              "transition-opacity",
              isOpen ? "opacity-100" : "opacity-0"
            )}
          >
            Keluar
          </span>
        </Link>
      </Button>
    </div>
  );
}
