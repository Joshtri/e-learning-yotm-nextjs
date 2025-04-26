// /config/navigation.js
import {
  Layout,
  Users2,
  Users,
  BookOpen,
  FileText,
  ClipboardList,
  GraduationCap,
  FileCheck2,
  NotebookPen,
  ChartBar,
  MessagesSquare,
  CalendarCheck,
  FileSearch,
} from "lucide-react";

export const navByRole = {
  admin: [
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
          title: "Paket",
          href: "/admin/programs",
          icon: <ClipboardList className="h-4 w-4" />,
        },
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
          title: "Materi Pembelajaran",
          href: "/admin/learning-materials",
          icon: <ChartBar className="h-4 w-4" />,
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
          title: "Ujian Mid & Final",
          href: "/admin/exams",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          title: "Ujian Harian & Awal Semester",
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
  ],
  tutor: [
    {
      title: "Dashboard",
      items: [
        {
          title: "Dashboard",
          href: "/tutor/dashboard",
          icon: <Layout className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Kelas",
      items: [
        {
          title: "Kelas Saya",
          href: "/tutor/my-classes",
          icon: <Users className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Pembelajaran",
      items: [
        {
          title: "Materi Pembelajaran",
          href: "/tutor/materials",
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          title: "Tugas",
          href: "/tutor/assignments",
          icon: <NotebookPen className="h-4 w-4" />,
        },
        {
          title: "Kuis",
          href: "/tutor/quizzes",
          icon: <FileCheck2 className="h-4 w-4" />,
        },
        {
          title: "Ujian",
          href: "/tutor/exams",
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Penilaian",
      items: [
        {
          title: "Presensi Siswa",
          href: "/tutor/attendances",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          title: "Nilai Keterampilan",
          href: "/tutor/skill-scores",
          icon: <GraduationCap className="h-4 w-4" />,
        },
        {
          title: "Pengumpulan",
          href: "/tutor/submissions",
          icon: <FileSearch className="h-4 w-4" />,
        },
        {
          title: "Manajemen Naik Kelas",
          href: "/tutor/promote-students",
          icon: <Users className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Komunikasi",
      items: [
        {
          title: "Pesan",
          href: "/tutor/messages",
          icon: <MessagesSquare className="h-4 w-4" />,
          badge: 0,
        },
      ],
    },
  ],

  student: [
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
      title: "Kelas",
      items: [
        {
          title: "Kelas Saya",
          href: "/siswa/my-class",
          icon: <Users className="h-4 w-4" />,
        },

        {
          title: "Presensi",
          href: "/siswa/attendance",
          icon: <CalendarCheck className="h-4 w-4" />, // icon baru yang cocok
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
          title: "Ujian Mid & Final",
          href: "/siswa/exams",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          title: "Ujian Harian & Awal Semester",
          href: "/siswa/daily-exams",
          icon: <ClipboardList className="h-4 w-4" />,
        },
      ],
    },

    {
      title: "Nilai",
      items: [
 
        {
          title: "Nilai Ujian",
          href: "/siswa/exams-scores",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Nilai Lainnya",
          href: "/siswa/other-scores",
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Komunikasi",
      items: [
        {
          title: "Forum Diskusi",
          href: "/siswa/discussions",
          icon: <MessagesSquare className="h-4 w-4" />,
          badge: 0,
        },
      ],
    },
  ],
};
