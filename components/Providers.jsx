"use client";

import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { Toaster } from "sonner";
import { TitleProvider } from "@/contexts/TitleContext";

export function Providers({ children }) {
  return (

    <ReactQueryProvider>
      <TitleProvider>
        <Toaster richColors position="top-right" />
        {children}
      </TitleProvider>
    </ReactQueryProvider>
  );
}
