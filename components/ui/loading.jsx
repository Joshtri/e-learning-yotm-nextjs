"use client";

import { Loader2 } from "lucide-react";

export function LoadingOverlay({ isVisible, message = "Memproses..." }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}

export function LoadingButton({
  children,
  isLoading = false,
  loadingText = "Memproses...",
  ...props
}) {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`${props.className} relative`}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      {isLoading ? loadingText : children}
    </button>
  );
}
