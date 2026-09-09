"use client";

// Singurul boundary client pentru chat — useChat deține istoricul și stream-ul.
// Provider-ul ridică sesiunea peste sidebar/header ca New/Export să taie aceeași listă.
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatSessionProvider, type ChatSessionValue, type ExportFormat } from "@/components/chat/chat-session-context";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  buildExportFilename,
  buildExportPayload,
  downloadTextFile,
  serializeExportJson,
  serializeExportMarkdown
} from "@/lib/message-utils";
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

interface ChatViewValue {
  hydrated: boolean;
  messages: UIMessage[];
  isBusy: boolean;
  status: "submitted" | "streaming" | "ready" | "error";
  error: Error | undefined;
  clearError: () => void;
  input: string;
  setInput: (value: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  handleSend: () => void;
  stop: () => void;
  regenerateMessage: (messageId: string) => void;
}

const ChatViewContext = createContext<ChatViewValue | null>(null);

export function ChatSessionRoot({ children }: { children: React.ReactNode }) {
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

  const { messages, sendMessage, status, stop, error, clearError, setMessages, regenerate } = useChat({
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

  const handleSend = useCallback(() => {
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
  }, [
    input,
    isBusy,
    activeConversationId,
    createConversation,
    renameConversation,
    conversations,
    messages.length,
    sendMessage
  ]);

  const startNewChat = useCallback(() => {
    // Golirea e distructivă pentru lista din useChat — confirmăm înainte să tăiem.
    if (messages.length > 0) {
      const confirmed = window.confirm(
        "Începi o conversație nouă? Mesajele din chatul curent vor fi golite din acest ecran."
      );
      if (!confirmed) return;
      setMessages([]);
    }
    createConversation();
  }, [messages.length, setMessages, createConversation]);

  const regenerateMessage = useCallback(
    (messageId: string) => {
      if (isBusy) return;
      // regenerate taie singur mesajul țintă și pe cele de după — altfel apare un al doilea răspuns.
      void regenerate({ messageId });
    },
    [isBusy, regenerate]
  );

  const exportConversation = useCallback(
    (format: ExportFormat) => {
      const conversation = conversations.find(c => c.id === activeConversationId);
      const title = conversation?.title ?? "Conversație SkillForge";
      const payload = buildExportPayload(messages, profile, title);
      const content = format === "json" ? serializeExportJson(payload) : serializeExportMarkdown(payload);
      const filename = buildExportFilename(format === "json" ? "json" : "md");
      const mimeType = format === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8";
      downloadTextFile(filename, content, mimeType);
      toast.success(format === "json" ? "Export JSON descărcat" : "Export Markdown descărcat");
    },
    [conversations, activeConversationId, messages, profile]
  );

  const sessionValue = useMemo<ChatSessionValue>(
    () => ({
      messages,
      isBusy,
      startNewChat,
      regenerateMessage,
      exportConversation
    }),
    [messages, isBusy, startNewChat, regenerateMessage, exportConversation]
  );

  const viewValue = useMemo<ChatViewValue>(
    () => ({
      hydrated,
      messages,
      isBusy,
      status,
      error,
      clearError,
      input,
      setInput,
      inputRef,
      handleSend,
      stop,
      regenerateMessage
    }),
    [hydrated, messages, isBusy, status, error, clearError, input, handleSend, stop, regenerateMessage]
  );

  return (
    <ChatSessionProvider value={sessionValue}>
      <ChatViewContext.Provider value={viewValue}>{children}</ChatViewContext.Provider>
    </ChatSessionProvider>
  );
}

export function Chat() {
  const props = useContext(ChatViewContext);
  if (!props) {
    throw new Error("Chat trebuie folosit în ChatSessionRoot");
  }

  const {
    hydrated,
    messages,
    isBusy,
    status,
    error,
    clearError,
    input,
    setInput,
    inputRef,
    handleSend,
    stop,
    regenerateMessage
  } = props;

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
          <MessageList isBusy={isBusy} messages={messages} onRegenerate={regenerateMessage} status={status} />
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
