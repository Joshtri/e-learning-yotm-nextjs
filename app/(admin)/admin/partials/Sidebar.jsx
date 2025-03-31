import Link from "next/link";
import {
  ChartBar,
  BookOpen,
  FileText,
  GraduationCap,
  Layout,
  Users,
  X,
  ArrowRight,
  Settings,
  LogOut,
  MessagesSquare,
  Users2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

 
export function AdminSidebar({ isOpen, onToggleSidebar }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-background transition-transform duration-300 md:static ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-16"
      }`}
    >
      <div className="border-b px-3 py-2 h-16 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              YOT
            </span>
          </div>
          <span
            className={`font-bold transition-opacity ${
              isOpen ? "opacity-100" : "opacity-0 md:hidden"
            }`}
          >
            Obor Timor
          </span>
        </Link>

        {/* Tombol Collapse/Expand di bagian bawah */}
        <div className="mt-auto p-3 md:block hidden">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="flex items-center justify-center w-5 rounded-md border bg-muted text-muted-foreground hover:bg-muted/70 transition"
              title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
            >
              {isOpen ? (
                <X className="h-6 w-6 " />
              ) : (
                <ArrowRight className="h-6 w-6" />
              )}
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Dashboard
              </span>
            </Link>
          </Button>


          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/users" className="flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Users
              </span>
            </Link>
          </Button>

          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/students" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Siswa
              </span>
            </Link>
          </Button>

          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/classes" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Kelas
              </span>
            </Link>
          </Button>



          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/tutors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Tutor
              </span>
            </Link>
          </Button>

          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/academic-years" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Tahun Akademik
              </span>
            </Link>
          </Button>

          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/subject" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Mata Pelajaran
              </span>
            </Link>
          </Button>
          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/program-subject" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Mata Pelajaran per Paket
              </span>
            </Link>
          </Button>

          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/programs" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Paket
              </span>
            </Link>
          </Button>

          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/class-subject-tutor" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Penugasan Tutor
              </span>
            </Link>
          </Button>

          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/learning-materials" className="flex items-center gap-2">
              <ChartBar className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Learning Materials
              </span>
            </Link>
          </Button>

          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/messages" className="flex items-center gap-2">
              <MessagesSquare className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Pesan
              </span>
              {/* <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                3
              </span> */}
            </Link>
          </Button>

          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span
                className={`transition-opacity ${
                  isOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Dokumen
              </span>
            </Link>
          </Button>
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
        <Button variant="ghost" asChild className="justify-start w-full">
          <Link href="/admin/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span
              className={`transition-opacity ${
                isOpen ? "opacity-100" : "opacity-0 md:hidden"
              }`}
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
              className={`transition-opacity ${
                isOpen ? "opacity-100" : "opacity-0 md:hidden"
              }`}
            >
              Keluar
            </span>
          </Link>
        </Button>
      </div>
    </aside>
  );
}
