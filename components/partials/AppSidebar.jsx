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
    <div className="mb-2">
      {group.title !== "Dashboard" && (
        <div
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer"
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
                "justify-start w-full",
                isActive && "bg-muted text-primary font-semibold"
              )}
            >
              <Link href={item.href} className="flex items-center gap-2 w-full">
                {item.icon}
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
        <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background">
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
        "sticky top-0 hidden md:flex md:flex-col md:border-r bg-background transition-all h-screen",
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
    <div className="border-b px-3 py-2 h-16 flex items-center justify-between">
      <Link href="#" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <span className="text-sm font-bold text-primary-foreground">YOT</span>
        </div>
        <span
          className={cn(
            "font-bold transition-opacity",
            isOpen ? "opacity-100" : "opacity-0 md:hidden"
          )}
        >
          Obor Timor
        </span>
      </Link>
      {onClose && (
        <button onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      )}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex items-center justify-center w-5 rounded-md border bg-muted text-muted-foreground hover:bg-muted/70 transition"
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
    <div className="flex-1 overflow-auto">
      <nav className="flex flex-col px-3 py-2">
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
  const base =
    role === "admin" ? "/admin" : role === "tutor" ? "/tutor" : "/siswa";
  return (
    <div className="border-t p-3">
      {role === "admin" && (
        <Button variant="ghost" asChild className="justify-start w-full">
          <Link href={`${base}/settings`} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span
              className={cn(
                "transition-opacity",
                isOpen ? "opacity-100" : "opacity-0"
              )}
            >
              Pengaturan
            </span>
          </Link>
        </Button>
      )}
      <Button
        variant="ghost"
        asChild
        className="justify-start w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
      >
        <Link href="/login" className="flex items-center gap-2">
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
