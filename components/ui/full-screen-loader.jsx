"use client";

import { Progress } from "@/components/ui/progress";

export function FullScreenLoader({ progress = 0, message = "Memuat..." }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-4">
          <p className="text-muted-foreground">{message}</p>
        </div>
        <Progress value={progress} className="h-2 w-full" />
      </div>
    </div>
  );
}
