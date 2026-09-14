"use client";

// Un mesaj UIMessage — text din message-utils; markdown doar prin componentul dedicat.
// Acțiuni pe hover: copiere / editare (user) / reluare (ultimul assistant).
import type { UIMessage } from "ai";
import { Bot, Check, Copy, Pencil, RotateCcw, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Markdown } from "@/components/chat/markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  /** Editare + retrimitere: taie istoricul de la acest mesaj în jos. */
  onEdit?: (messageId: string, text: string) => void;
}

export function MessageItem({
  message,
  showRegenerate = false,
  isBusy = false,
  onRegenerate,
  onEdit
}: MessageItemProps) {
  const profileName = useAppStore(state => state.profile.name);
  const isUser = message.role === "user";
  const content = getMessageText(message);
  // După mount: pe server / IP local clipboard poate lipsi — evităm crash și mismatch de hidratare.
  const [canCopy, setCanCopy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    setCanCopy(isClipboardAvailable());
  }, []);

  // Când mesajul din listă se schimbă (ex. după edit reușit), aliniem draft-ul.
  useEffect(() => {
    if (!isEditing) {
      setDraft(content);
    }
  }, [content, isEditing]);

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

  const startEdit = () => {
    // Editarea pe stream activ ar trimite peste un răspuns în curs — rezultat nedeterminist.
    if (isBusy || !onEdit) return;
    setDraft(content);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(content);
    setIsEditing(false);
  };

  const submitEdit = () => {
    const text = draft.trim();
    if (!text || !onEdit || isBusy) return;
    setIsEditing(false);
    onEdit(message.id, text);
  };

  const canEdit = isUser && Boolean(onEdit) && !isBusy;

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
            "group/bubble relative rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {isEditing ? (
            <div className="flex w-[min(100vw-6rem,28rem)] flex-col gap-2">
              <Textarea
                className="min-h-[80px] resize-y bg-primary-foreground/10 text-primary-foreground"
                onChange={event => setDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitEdit();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelEdit();
                  }
                }}
                value={draft}
              />
              <div className="flex justify-end gap-1">
                <Button onClick={cancelEdit} size="icon-xs" type="button" variant="ghost">
                  <X className="size-3.5" />
                </Button>
                <Button disabled={!draft.trim()} onClick={submitEdit} size="icon-xs" type="button" variant="secondary">
                  <Check className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <Markdown className={cn(isUser && "prose-invert [&_a]:text-primary-foreground")} content={content} />
          )}
          {!isEditing && content && (canCopy || showRegenerate || canEdit) && (
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
              {canEdit && (
                <Tooltip>
                  <TooltipTrigger
                    className={cn("rounded-md p-1", "hover:bg-primary-foreground/10")}
                    onClick={startEdit}
                  >
                    <Pencil className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>Editează</TooltipContent>
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
