"use client";

import React from "react";
import { Paperclip, Send, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * @param {Object} props
 * @param {Function} props.onSendMessage
 * @param {string} [props.className]    
 */
export function ChatInput({ onSendMessage, className }) {
  const [message, setMessage] = React.useState("");
  const textareaRef = React.useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
      // Focus back on textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    // Send message on Enter (without shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn("border-t p-4", className)}>
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <Paperclip className="h-5 w-5" />
                <span className="sr-only">Lampirkan file</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Lampirkan file</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="Ketik pesan..."
            className="min-h-[80px] resize-none pr-10"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute bottom-2 right-2"
          >
            <Smile className="h-5 w-5" />
            <span className="sr-only">Emoji</span>
          </Button>
        </div>

        <Button
          type="submit"
          size="icon"
          className="shrink-0"
          disabled={!message.trim()}
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Kirim</span>
        </Button>
      </form>
    </div>
  );
}
