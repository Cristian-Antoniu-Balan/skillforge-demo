"use client";

// Singurul boundary client pentru chat — useChat deține istoricul și stream-ul.
// Profil + model din store merg în body: ce e afișat e ce apelează /api/chat.
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppStore } from "@/store/useAppStore";

function titleFromMessage(content: string) {
  const trimmed = content.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed || "Conversație nouă";
}

function formatChatError(error: Error) {
  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    // mesajul nu e JSON — îl afișăm ca atare
  }
  return error.message;
}

export function Chat() {
  const profile = useAppStore(state => state.profile);
  const selectedModel = useAppStore(state => state.selectedModel);
  const activeConversationId = useAppStore(state => state.activeConversationId);
  const createConversation = useAppStore(state => state.createConversation);
  const renameConversation = useAppStore(state => state.renameConversation);
  const conversations = useAppStore(state => state.conversations);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const modelRef = useRef(selectedModel);
  modelRef.current = selectedModel;

  const pendingTextRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        // model + profile: ce vezi în UI = ce trimite serverul la Anthropic
        body: () => ({ profile: profileRef.current, model: modelRef.current })
      }),
    []
  );

  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    id: activeConversationId ?? "new",
    transport
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    setHydrated(true);
  }, []);

  // New / switch recrează chat-ul (id schimbat). Mesajul așteptat de la primul send se trimite după.
  useEffect(() => {
    const pending = pendingTextRef.current;
    if (!pending || !activeConversationId) return;
    pendingTextRef.current = null;
    void sendMessage({ text: pending }).then(() => {
      inputRef.current?.focus();
    });
  }, [activeConversationId, sendMessage]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isBusy) return;

    setInput("");

    if (!activeConversationId) {
      pendingTextRef.current = text;
      const id = createConversation();
      renameConversation(id, titleFromMessage(text));
      return;
    }

    const conversation = conversations.find(c => c.id === activeConversationId);
    if (conversation && (conversation.title === "Conversație nouă" || messages.length === 0)) {
      renameConversation(activeConversationId, titleFromMessage(text));
    }

    void sendMessage({ text }).then(() => {
      inputRef.current?.focus();
    });
  };

  if (!hydrated) {
    return (
      <div className="flex flex-1 flex-col">
        <MessageList isBusy={false} messages={[]} />
      </div>
    );
  }

  const showEmpty = messages.length === 0 && !isBusy;
  const errorText = error ? formatChatError(error) : null;
  const isUnconfiguredProvider = errorText?.startsWith("Provider neconfigurat") ?? false;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {errorText && (
        <div className="px-4 pt-4">
          <Alert variant="destructive">
            <AlertTitle>{isUnconfiguredProvider ? "Provider neconfigurat" : "Eroare"}</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{errorText}</span>
              <button className="text-sm underline" onClick={() => clearError()} type="button">
                Închide
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {showEmpty ? (
          <EmptyState onSuggestion={setInput} />
        ) : (
          <MessageList isBusy={isBusy} messages={messages} status={status} />
        )}
      </div>

      <ChatInput
        draft={input}
        inputRef={inputRef}
        isBusy={isBusy}
        onDraftChange={setInput}
        onSend={handleSend}
        onStop={() => stop()}
      />
    </div>
  );
}
