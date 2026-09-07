// Composer-ul chat — input controlat; Enter trimite, Shift+Enter linie nouă.
// Send/Stop comută după isBusy (submitted | streaming).
import { ChevronDown, Plus, Send, Square } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mockProviders, useAppStore } from "@/store/useAppStore";

interface ChatInputProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isBusy: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({ draft, onDraftChange, onSend, onStop, isBusy, inputRef }: ChatInputProps) {
  const selectedProviderId = useAppStore(state => state.selectedProviderId);
  const selectedModel = useAppStore(state => state.selectedModel);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const provider = mockProviders.find(p => p.id === selectedProviderId);

  const adjustHeight = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [draft, inputRef]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4">
      <div className="rounded-2xl border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring/50">
        <Textarea
          className="max-h-[200px] min-h-[52px] resize-none border-0 bg-transparent px-4 pt-4 pb-2 shadow-none focus-visible:ring-0"
          onChange={event => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Spune-i lui SkillForge la ce lucrezi…"
          ref={inputRef}
          rows={1}
          value={draft}
        />
        <div className="flex items-center justify-between gap-2 px-3 pb-3">
          <Button aria-label="Atașamente (Modul 6)" disabled size="icon-sm" variant="ghost">
            <Plus className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              type="button"
            >
              <span>{provider?.name ?? "Provider"}</span>
              <span className="text-muted-foreground/70">·</span>
              <span className="max-w-[8rem] truncate">{selectedModel}</span>
              <ChevronDown className="size-3" />
            </button>
            {isBusy ? (
              <Button aria-label="Stop" onClick={onStop} size="icon-sm" variant="default">
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                aria-label="Trimite"
                disabled={!draft.trim()}
                onClick={onSend}
                size="icon-sm"
                variant="default"
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Răspunsurile vin de la Claude (Anthropic) prin `/api/chat` — cheia rămâne pe server.
      </p>
    </div>
  );
}
