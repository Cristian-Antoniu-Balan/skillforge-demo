"use client";

// Un mesaj individual — bule aliniate stânga/dreapta + copy în interior cu toast.
import { Bot, Copy, User } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const profileName = useAppStore(state => state.profile.name);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    toast.success("Mesaj copiat în clipboard");
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
          {message.content}
          <Tooltip>
            <TooltipTrigger
              className={cn(
                "absolute top-2 rounded-md p-1 opacity-0 transition-opacity group-hover/bubble:opacity-100",
                isUser ? "left-2 hover:bg-primary-foreground/10" : "right-2 hover:bg-background/60"
              )}
              onClick={handleCopy}
            >
              <Copy className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Copiază</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
