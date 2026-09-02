"use client";

// Orchestratorul zonei centrale — alege empty state vs listă mesaje după conversația activă.
// Păstrează draft-ul composer-ului ca sugestiile din empty state să pre-completeze inputul.
import { useEffect, useState } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppStore } from "@/store/useAppStore";

export function Chat() {
  const activeConversationId = useAppStore(state => state.activeConversationId);
  const conversations = useAppStore(state => state.conversations);
  const isLoading = useAppStore(state => state.isLoading);
  const isTyping = useAppStore(state => state.isTyping);
  const error = useAppStore(state => state.error);
  const clearError = useAppStore(state => state.clearError);
  const simulateLoading = useAppStore(state => state.simulateLoading);

  const [draft, setDraft] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    simulateLoading();
  }, [activeConversationId, simulateLoading]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const hasMessages = (activeConversation?.messages.length ?? 0) > 0;
  const showEmpty = !activeConversationId || !hasMessages;

  if (!hydrated) {
    return (
      <div className="flex flex-1 flex-col">
        <MessageList isLoading isTyping={false} messages={[]} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {error && (
        <div className="px-4 pt-4">
          <Alert variant="destructive">
            <AlertTitle>Eroare</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{error}</span>
              <button className="text-sm underline" onClick={clearError} type="button">
                Închide
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {showEmpty && !isLoading ? (
          <EmptyState onSuggestion={setDraft} />
        ) : (
          <MessageList isLoading={isLoading} isTyping={isTyping} messages={activeConversation?.messages ?? []} />
        )}
      </div>

      <ChatInput draft={draft} onDraftChange={setDraft} />
    </div>
  );
}
