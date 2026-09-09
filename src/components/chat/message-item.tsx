"use client";

// Un mesaj UIMessage — text din message-utils; acțiuni pe hover (copiere / reluare).
import type { UIMessage } from "ai";
import { Bot, Copy, RotateCcw, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getMessageText, isClipboardAvailable } from "@/lib/message-utils";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface MessageItemProps {
  message: UIMessage;
  /** Doar pe ultimul răspuns assistant — înlocuire evidentă, nu al doilea bubble. */
  showRegenerate?: boolean;
  isBusy?: boolean;
  onRegenerate?: (messageId: string) => void;
}

export function MessageItem({ message, showRegenerate = false, isBusy = false, onRegenerate }: MessageItemProps) {
  const profileName = useAppStore(state => state.profile.name);
  const isUser = message.role === "user";
  const content = getMessageText(message);
  // După mount: pe server / IP local clipboard poate lipsi — evităm crash și mismatch de hidratare.
  const [canCopy, setCanCopy] = useState(false);

  useEffect(() => {
    setCanCopy(isClipboardAvailable());
  }, []);

  const handleCopy = async () => {
    if (!canCopy) {
      toast.error("Copierea nu e disponibilă în acest context (necesită HTTPS sau localhost)");
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Mesaj copiat în clipboard");
    } catch {
      toast.error("Nu am putut copia mesajul");
    }
  };

  const handleRegenerate = () => {
    if (!onRegenerate || isBusy) return;
    onRegenerate(message.id);
  };

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className={cn(isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
          {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[min(100%,42rem)] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <span className="px-1 text-xs text-muted-foreground">{isUser ? profileName : "SkillForge"}</span>
        <div
          className={cn(
            "group/bubble relative rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {content}
          {content && (canCopy || showRegenerate) && (
            <div
              className={cn(
                "absolute top-2 flex gap-0.5 opacity-0 transition-opacity group-hover/bubble:opacity-100",
                isUser ? "left-2" : "right-2"
              )}
            >
              {canCopy && (
                <Tooltip>
                  <TooltipTrigger
                    className={cn(
                      "rounded-md p-1",
                      isUser ? "hover:bg-primary-foreground/10" : "hover:bg-background/60"
                    )}
                    onClick={handleCopy}
                  >
                    <Copy className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>Copiază</TooltipContent>
                </Tooltip>
              )}
              {showRegenerate && (
                <Tooltip>
                  <TooltipTrigger
                    className={cn(
                      "rounded-md p-1",
                      isBusy && "pointer-events-none opacity-40",
                      isUser ? "hover:bg-primary-foreground/10" : "hover:bg-background/60"
                    )}
                    disabled={isBusy}
                    onClick={handleRegenerate}
                  >
                    <RotateCcw className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>Mai încearcă</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
