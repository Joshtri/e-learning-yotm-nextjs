"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChartIcon as ChartBar,
  BookOpen,
  FileText,
  GraduationCap,
  Layout,
  Users,
  X,
  ChevronRight,
  Settings,
  LogOut,
  MessagesSquare,
  Users2,
  ClipboardList,
  FileCheck2,
  NotebookPen,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Navigation groups
const navigationGroups = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: <Layout className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Pengguna",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: <Users2 className="h-4 w-4" />,
      },
      {
        title: "Siswa",
        href: "/admin/students",
        icon: <GraduationCap className="h-4 w-4" />,
      },
      {
        title: "Tutor",
        href: "/admin/tutors",
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Akademik",
    items: [
      {
        title: "Kelas",
        href: "/admin/classes",
        icon: <GraduationCap className="h-4 w-4" />,
      },
      {
        title: "Tahun Akademik",
        href: "/admin/academic-years",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        title: "Mata Pelajaran",
        href: "/admin/subject",
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        title: "Mata Pelajaran per Paket",
        href: "/admin/program-subject",
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        title: "Paket",
        href: "/admin/programs",
        icon: <ClipboardList className="h-4 w-4" />,
      },
      {
        title: "Penugasan Tutor",
        href: "/admin/class-subject-tutor",
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Pembelajaran",
    items: [
      {
        title: "Learning Materials",
        href: "/admin/learning-materials",
        icon: <ChartBar className="h-4 w-4" />,
      },
      {
        title: "Materi",
        href: "/admin/materials",
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        title: "Tugas",
        href: "/admin/assignments",
        icon: <NotebookPen className="h-4 w-4" />,
      },
      {
        title: "Kuis",
        href: "/admin/quizzes",
        icon: <FileCheck2 className="h-4 w-4" />,
      },
      {
        title: "Ujian",
        href: "/admin/exams",
        icon: <ClipboardList className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Penilaian",
    items: [
      {
        title: "Naik Kelas",
        href: "/admin/naik-kelas",
        icon: <GraduationCap className="h-4 w-4" />,
      },
      {
        title: "Rekapitulasi Nilai Siswa",
        href: "/admin/students-scores-recap",
        icon: <ChartBar className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Komunikasi",
    items: [
      {
        title: "Pesan",
        href: "/admin/messages",
        icon: <MessagesSquare className="h-4 w-4" />,
        badge: 0,
      },
    ],
  },
];

const NavGroupComponent = ({ group, isOpen, expandedGroups, toggleGroup }) => {
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

export function AdminSidebar({ isOpen, onToggleSidebar, isMobile, onClose }) {
  const [expandedGroups, setExpandedGroups] = React.useState({
    Dashboard: true,
    Pengguna: true,
    Akademik: true,
    Pembelajaran: true,
    Penilaian: true,
    Komunikasi: true,
  });

  const toggleGroup = (title) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Jika mobile dan sidebar terbuka, tambahkan overlay
  if (isMobile && isOpen) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background"
          )}
        >
          {/* Isi sidebar sama seperti sebelumnya */}
          <div className="border-b px-3 py-2 h-16 flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  YOT
                </span>
              </div>
              <span className="font-bold">Obor Timor</span>
            </Link>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <ScrollArea className="flex-1 px-3 py-2">
            <nav className="flex flex-col">
              {navigationGroups.map((group) => (
                <NavGroupComponent
                  key={group.title}
                  group={group}
                  isOpen={true}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                />
              ))}
            </nav>
          </ScrollArea>

          <div className="border-t p-3">
            <Button variant="ghost" asChild className="justify-start w-full">
              <Link href="/admin/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Pengaturan</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="justify-start w-full text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Link href="/login" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Keluar</span>
              </Link>
            </Button>
          </div>
        </aside>
      </>
    );
  }

  // Tampilan desktop
  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:w-64 md:border-r md:bg-background md:static",
        isOpen ? "md:w-64" : "md:w-16"
      )}
    >
      {/* Isi sidebar untuk desktop */}
      <div className="border-b px-3 py-2 h-16 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              YOT
            </span>
          </div>
          <span
            className={cn(
              "font-bold transition-opacity",
              isOpen ? "opacity-100" : "opacity-0"
            )}
          >
            Obor Timor
          </span>
        </Link>
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
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col">
          {navigationGroups.map((group) => (
            <NavGroupComponent
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
        <Button variant="ghost" asChild className="justify-start w-full">
          <Link href="/admin/settings" className="flex items-center gap-2">
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
        <Button
          variant="ghost"
          asChild
          className="justify-start w-full text-red-500 hover:text-red-600 hover:bg-red-50"
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
    </aside>
  );
}
