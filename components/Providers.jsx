"use client";

import { ThemeProvider } from "@/providers/themes-provider";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { Toaster } from "sonner";

export function Providers({ children }) {
  return (
    // <ThemeProvider
    //   attribute="class"
    //   defaultTheme="light"
    //   enableSystem

    //   // disableTransitionOnChange
    // >
    // </ThemeProvider>
    <ReactQueryProvider>
      <Toaster richColors position="top-right" />
      {children}
    </ReactQueryProvider>
  );
}
