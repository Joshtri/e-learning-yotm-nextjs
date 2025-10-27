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

  // List of some common emojis
  const emojiList = ["😀", "😂", "😊", "😍", "👍", "🙏", "😎", "😭", "🔥", "🥳"];

  // Show/hide emoji picker
  const [showEmojis, setShowEmojis] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
      setShowEmojis(false);
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

  const handleEmojiButtonClick = () => {
    setShowEmojis((v) => !v);
  };

  const handleEmojiSelect = (emoji) => {
    // Option 1: Instantly send the emoji as a message
    onSendMessage(emoji);
    setShowEmojis(false);
    setMessage("");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);

    // Option 2: Insert emoji into current textarea
    // setMessage((m) => m + emoji);
    // setShowEmojis(false);
    // setTimeout(() => {
    //   textareaRef.current?.focus();
    // }, 0);
  };

  // Dismiss emoji picker when clicking outside
  React.useEffect(() => {
    if (!showEmojis) return;
    function handleClickOutside(e) {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(e.target) &&
        !document.getElementById("chat-emoji-picker")?.contains(e.target)
      ) {
        setShowEmojis(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojis]);

  return (
    <div className={cn("border-t p-4", className)}>
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* <TooltipProvider>
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
        </TooltipProvider> */}

        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="Ketik pesan..."
            className="min-h-[80px] resize-none pr-10"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute bottom-2 right-2 flex flex-col items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleEmojiButtonClick}
              aria-pressed={showEmojis}
            >
              <Smile className="h-5 w-5" />
              <span className="sr-only">Emoji</span>
            </Button>
            {showEmojis && (
              <div
                id="chat-emoji-picker"
                className="z-50 mt-2 rounded-lg border bg-popover p-2 shadow-lg flex flex-wrap gap-1 max-w-[220px]"
                style={{
                  position: "absolute",
                  bottom: "110%",
                  right: 0,
                }}
              >
                {emojiList.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-lg hover:bg-accent rounded p-1 transition"
                    onClick={() => handleEmojiSelect(emoji)}
                    tabIndex={0}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
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
