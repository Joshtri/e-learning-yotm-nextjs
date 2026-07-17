"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const OWNER = "Joshtri Lenggu";
const YEAR = new Date().getFullYear();
const PROJECT = "E-Learning YOTM";

function logAccess(pathname) {
  try {
    fetch("/api/internal/access-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, event: "page_visit" }),
    }).catch(() => {});
  } catch {}
}

function setupProtection() {
  // Peringatan di DevTools console
  const style = "color:#e53e3e;font-size:16px;font-weight:bold;";
  const style2 = "color:#2d3748;font-size:13px;";
  console.log(
    `%c⚠️  PERINGATAN — SISTEM DILINDUNGI HAK CIPTA`,
    style
  );
  console.log(
    `%cSistem ini adalah karya tugas akhir milik ${OWNER}.\nSeluruh aktivitas akses, inspeksi, dan penggunaan dipantau dan dicatat.\n© ${YEAR} ${OWNER} — ${PROJECT}. Dilarang menyalin atau mendistribusikan tanpa izin.`,
    style2
  );

  // Blokir klik kanan
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });

  // Blokir shortcut berbahaya di keyboard
  document.addEventListener("keydown", (e) => {
    const key = e.key?.toUpperCase();
    const ctrl = e.ctrlKey || e.metaKey;

    // F12 — DevTools
    if (e.key === "F12") {
      e.preventDefault();
      return false;
    }
    // Ctrl+U — View Source
    if (ctrl && key === "U") {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I — DevTools
    if (ctrl && e.shiftKey && key === "I") {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J — DevTools Console
    if (ctrl && e.shiftKey && key === "J") {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+C — DevTools Inspector
    if (ctrl && e.shiftKey && key === "C") {
      e.preventDefault();
      return false;
    }
    // Ctrl+S — Save page
    if (ctrl && key === "S") {
      e.preventDefault();
      return false;
    }
    // Ctrl+A — Select all (izinkan di input/textarea, blokir di luar)
    if (ctrl && key === "A") {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (!["input", "textarea"].includes(tag)) {
        e.preventDefault();
        return false;
      }
    }
    // Ctrl+P — Print
    if (ctrl && key === "P") {
      e.preventDefault();
      return false;
    }
  });

  // Blokir drag gambar
  document.addEventListener("dragstart", (e) => {
    if (e.target?.tagName?.toLowerCase() === "img") {
      e.preventDefault();
    }
  });

  // Deteksi DevTools terbuka via perubahan ukuran window
  let devtoolsOpen = false;
  const threshold = 160;
  setInterval(() => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > threshold || heightDiff > threshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        fetch("/api/internal/access-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: window.location.pathname,
            event: "devtools_opened",
          }),
        }).catch(() => {});
      }
    } else {
      devtoolsOpen = false;
    }
  }, 2000);
}

export default function CopyrightGuard() {
  const pathname = usePathname();

  useEffect(() => {
    setupProtection();
  }, []);

  useEffect(() => {
    logAccess(pathname);
  }, [pathname]);

  return (
    <>
      {/* Watermark diagonal — terlihat di semua halaman */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          pointerEvents: "none",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* Grid watermark text */}
        {Array.from({ length: 12 }).map((_, row) =>
          Array.from({ length: 6 }).map((_, col) => (
            <div
              key={`${row}-${col}`}
              style={{
                position: "absolute",
                top: `${row * 18}%`,
                left: `${col * 20 - 5}%`,
                transform: "rotate(-35deg)",
                fontSize: "11px",
                fontWeight: 500,
                color: "rgba(0,0,0,0.045)",
                whiteSpace: "nowrap",
                letterSpacing: "0.5px",
                fontFamily: "sans-serif",
              }}
            >
              © {OWNER} · {PROJECT}
            </div>
          ))
        )}
      </div>

      {/* Footer copyright bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9998,
          background: "rgba(15,23,42,0.82)",
          backdropFilter: "blur(4px)",
          color: "#94a3b8",
          fontSize: "11px",
          textAlign: "center",
          padding: "4px 12px",
          letterSpacing: "0.3px",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        © {YEAR} {OWNER} — {PROJECT}. Hak cipta dilindungi. Sistem ini
        dipantau. Dilarang menyalin, mendistribusikan, atau memodifikasi tanpa
        izin tertulis.
      </div>
    </>
  );
}
