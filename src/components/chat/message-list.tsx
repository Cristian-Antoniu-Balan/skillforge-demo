// Lista de mesaje — key = id (nu index); scroll automat la ultimul mesaj.
import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";

import { MessageItem } from "@/components/chat/message-item";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageListProps {
  messages: UIMessage[];
  isBusy: boolean;
  status?: "submitted" | "streaming" | "ready" | "error";
  onRegenerate?: (messageId: string) => void;
}

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function MessageList({ messages, isBusy, status, onRegenerate }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBusy]);

  if (messages.length === 0 && !isBusy) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full max-w-lg rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Doar „submitted” — în streaming textul apare deja în ultimul mesaj.
  const showWaiting = status === "submitted";

  // Reluarea pe ultimul assistant: înlocuire vizibilă (bubble-ul vechi dispare).
  const lastAssistantId = [...messages].reverse().find(message => message.role === "assistant")?.id;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      {messages.map(message => (
        <MessageItem
          key={message.id}
          isBusy={isBusy}
          message={message}
          onRegenerate={onRegenerate}
          showRegenerate={message.role === "assistant" && message.id === lastAssistantId && !showWaiting}
        />
      ))}
      {showWaiting && <TypingIndicator label="SkillForge scrie…" />}
      <div ref={bottomRef} />
    </div>
  );
}
