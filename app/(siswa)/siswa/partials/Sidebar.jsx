"use client";

import React, { useState } from "react";

import Link from "next/link";
import {
  FileText,
  Layout,
  LogOut,
  ChevronRight,
  X,
  FileCheck2,
  NotebookPen,
  ClipboardList,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const navigationGroups = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Dashboard",
        href: "/siswa/dashboard",
        icon: <Layout className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Pembelajaran",
    items: [
      {
        title: "Mata Pelajaran Saya",
        href: "/siswa/my-subject",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        title: "Tugas",
        href: "/siswa/assignments/list",
        icon: <NotebookPen className="h-4 w-4" />,
      },
      {
        title: "Kuis",
        href: "/siswa/quizzes",
        icon: <FileCheck2 className="h-4 w-4" />,
      },
      {
        title: "Ujian",
        href: "/siswa/exams",
        icon: <ClipboardList className="h-4 w-4" />,
      },
    ],
  },
];

const NavGroup = ({ group, isOpen, expandedGroups, toggleGroup }) => {
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
        {group.items.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            asChild
            className="justify-start w-full"
          >
            <Link href={item.href} className="flex items-center gap-2">
              {item.icon}
              <span
                className={cn(
                  "transition-opacity",
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                )}
              >
                {item.title}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
};

export function StudentSidebar({ isOpen, onToggleSidebar }) {
  const [expandedGroups, setExpandedGroups] = useState({
    Dashboard: true,
    Pembelajaran: true,
  });

  const toggleGroup = (title) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-background transition-transform duration-300 md:static",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-16"
      )}
    >
      <div className="border-b px-3 py-2 h-16 flex items-center justify-between">
        <Link href="/siswa/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              YOT
            </span>
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

        <div className="mt-auto md:block hidden">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="flex items-center justify-center w-5 rounded-md border bg-muted text-muted-foreground hover:bg-muted/70 transition"
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
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col">
          {navigationGroups.map((group) => (
            <NavGroup
              key={group.title}
              group={group}
              isOpen={isOpen}
              expandedGroups={expandedGroups}
              toggleGroup={toggleGroup}
            />
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
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
                isOpen ? "opacity-100" : "opacity-0 md:hidden"
              )}
            >
              Keluar
            </span>
          </Link>
        </Button>
      </div>
    </aside>
  );
}
