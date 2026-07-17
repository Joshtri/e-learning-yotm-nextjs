import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import CopyrightGuard from "@/components/copyright/CopyrightGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "E-Learning YOTM",
  description: "Platform E-Learning Yayasan Obor Timor Ministry",
  authors: [{ name: "Joshtri Lenggu" }],
  creator: "Joshtri Lenggu",
  publisher: "Joshtri Lenggu",
  copyright: `© ${new Date().getFullYear()} Joshtri Lenggu. Hak cipta dilindungi.`,
  keywords: ["e-learning", "YOTM", "Joshtri Lenggu", "tugas akhir"],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Copyright meta tags */}
        <meta name="author" content="Joshtri Lenggu" />
        <meta name="copyright" content={`© ${new Date().getFullYear()} Joshtri Lenggu`} />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="generator" content="Joshtri Lenggu — Tugas Akhir" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <CopyrightGuard />
        </Providers>
      </body>
    </html>
  );
}
