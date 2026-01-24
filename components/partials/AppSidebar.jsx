"use client";

import { ChevronDown, ChevronRight, LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { navByRole } from "@/config/navigation";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import axios from "axios";
import { toast } from "sonner";

// Wrapper component for conditional tooltip
const ConditionalTooltip = ({ children, content, showTooltip }) => {
  if (!showTooltip) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Root delayDuration={0}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="right"
          sideOffset={8}
          className="z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white animate-in fade-in-0 zoom-in-95"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-gray-900" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};

const NavGroup = ({
  group,
  isOpen,
  expandedGroups,
  toggleGroup,
  currentSemester,
}) => {
  const pathname = usePathname();
  const isGroupExpanded = expandedGroups[group.title];

  return (
    <div className="mb-3">
      {group.title !== "Dashboard" && (
        <ConditionalTooltip content={group.title} showTooltip={!isOpen}>
          <div
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-blue-200 cursor-pointer hover:text-white transition-colors"
            onClick={() => toggleGroup(group.title)}
          >
            <span
              className={cn(isOpen ? "opacity-100" : "opacity-0 md:hidden")}
            >
              {group.title}
            </span>
            {isOpen && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isGroupExpanded ? "rotate-180" : "",
                )}
              />
            )}
          </div>
        </ConditionalTooltip>
      )}
      <div
        className={cn(
          "space-y-1",
          group.title !== "Dashboard" && !isGroupExpanded && isOpen
            ? "hidden"
            : "block",
        )}
      >
        {group.items.map((item) => {
          // Filter berdasarkan semester untuk homeroom
          if (item.showOnSemester && currentSemester) {
            if (item.showOnSemester !== currentSemester) {
              return null; // Skip item ini
            }
          }

          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          return (
            <ConditionalTooltip
              key={item.href}
              content={item.title}
              showTooltip={!isOpen}
            >
              <Button
                variant="ghost"
                asChild
                className={cn(
                  "justify-start w-full transition-all duration-200 hover:bg-blue-500/20 hover:text-white text-blue-100",
                  isActive &&
                    "bg-blue-400/30 text-white font-semibold border-r-2 border-blue-300",
                )}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-3 w-full"
                >
                  <span
                    className={cn(
                      "transition-colors",
                      isActive && "text-white",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={cn(
                      "transition-opacity",
                      isOpen ? "opacity-100" : "opacity-0 md:hidden",
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              </Button>
            </ConditionalTooltip>
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
  const [currentSemester, setCurrentSemester] = useState(null);

  const [expandedGroups, setExpandedGroups] = useState(
    Object.fromEntries(navigationGroups.map((g) => [g.title, true])),
  );

  useEffect(() => {
    // Fetch semester info untuk homeroom
    if (role === "homeroom") {
      fetchSemesterInfo();
    }
  }, [role]);

  const fetchSemesterInfo = async () => {
    try {
      const res = await api.get("/homeroom/dashboard");
      const classInfo = res.data.data?.classInfo;
      if (classInfo?.academicYear?.semester) {
        setCurrentSemester(classInfo.academicYear.semester);
      }
    } catch (error) {
      console.error("Error fetching semester info:", error);
    }
  };

  const toggleGroup = (title) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const baseHref =
    role === "admin" ? "/admin" : role === "tutor" ? "/tutor" : "/siswa";

  // Mobile Sidebar
  if (isMobile) {
    return (
      <TooltipProvider delayDuration={0}>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onClose}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-blue-600 to-blue-700 transition-transform duration-300 ease-in-out md:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarHeader href={baseHref} onClose={onClose} isOpen />
          <SidebarNav
            groups={navigationGroups}
            isOpen
            toggleGroup={toggleGroup}
            expandedGroups={expandedGroups}
            currentSemester={currentSemester}
          />
          <SidebarFooter role={role} isOpen />
        </aside>
      </TooltipProvider>
    );
  }

  // Desktop Sidebar
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "sticky top-0 hidden md:flex md:flex-col bg-gradient-to-b from-blue-600 to-blue-700 transition-all shadow-xl",
          isOpen ? "md:w-64" : "md:w-16",
        )}
        style={{ height: "100vh" }}
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
          currentSemester={currentSemester}
        />
        <SidebarFooter role={role} isOpen={isOpen} />
      </aside>
    </TooltipProvider>
  );
}

function SidebarHeader({ href, onClose, onToggleSidebar, isOpen = true }) {
  return (
    <div className="border-b border-blue-500/30 px-3 py-4 h-16 flex items-center justify-between mt-16">
      <ConditionalTooltip content="Obor Timor Ministry" showTooltip={!isOpen}>
        <Link href="#" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg overflow-hidden">
            <Image
              src="/android-chrome-192x192.png"
              alt="Obor Timor Ministry Logo"
              width={32}
              height={32}
              quality={100}
              priority
              className="h-full w-full"
            />
          </div>
          <span
            className={cn(
              "font-bold text-white drop-shadow-sm transition-opacity",
              isOpen ? "opacity-100" : "opacity-0 md:hidden",
            )}
          >
            Obor Timor Ministry
          </span>
        </Link>
      </ConditionalTooltip>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      )}
      {onToggleSidebar && (
        <ConditionalTooltip
          content={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
          showTooltip={!isOpen}
        >
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 shadow-sm border border-white/20"
          >
            {isOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </ConditionalTooltip>
      )}
    </div>
  );
}

function SidebarNav({
  groups,
  isOpen,
  toggleGroup,
  expandedGroups,
  currentSemester,
}) {
  return (
    <ScrollArea className="flex-1 overflow-hidden">
      <nav className="flex flex-col px-3 py-4">
        {groups.map((group) => (
          <NavGroup
            key={group.title}
            group={group}
            isOpen={isOpen}
            expandedGroups={expandedGroups}
            toggleGroup={toggleGroup}
            currentSemester={currentSemester}
          />
        ))}
      </nav>
    </ScrollArea>
  );
}

function LogoutButton({ isOpen }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      toast.success("Berhasil logout!");
      router.push("/");
    } catch {
      toast.error("Gagal logout");
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="ghost"
      className={cn(
        "flex w-full items-center gap-2 text-red-500 hover:text-red-600 justify-start transition-colors",
      )}
    >
      <LogOut className="h-4 w-4" />
      <span
        className={cn(
          "transition-opacity text-sm",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      >
        Keluar
      </span>
    </Button>
  );
}

function SidebarFooter({ role, isOpen }) {
  return (
    <div className="border-t border-blue-500/30 p-3 flex-shrink-0 mt-auto">
      {role === "admin" && <></>}
      <ConditionalTooltip content="Keluar" showTooltip={!isOpen}>
        <Button
          variant="ghost"
          asChild
          className="justify-start w-full text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-colors"
        >
          <LogoutButton isOpen={isOpen} />
        </Button>
      </ConditionalTooltip>
    </div>
  );
}
