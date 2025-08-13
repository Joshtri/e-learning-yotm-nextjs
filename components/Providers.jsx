"use client";

import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { Toaster } from "sonner";

export function Providers({ children }) {
  return (

    <ReactQueryProvider>
      <Toaster richColors position="top-right" />
      {children}
    </ReactQueryProvider>
  );
}
