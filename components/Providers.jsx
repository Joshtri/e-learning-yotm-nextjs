"use client";

import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }) {
  //initiate client here.
  const queryClient = new QueryClient();
  return (
    <ReactQueryProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster richColors position="top-right" />
        {children}
      </QueryClientProvider>
    </ReactQueryProvider>
  );
}
  