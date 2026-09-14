"use client";

// Boundary client pentru chat.
// useChat deține mesajele cât timp răspunsul curge; store-ul e arhiva după onFinish.
// key={conversationId} remontează hook-ul cu mesajele din arhivă — schimbarea id-ului
// activ singură nu-i resetează lista internă (ai vedea discuția precedentă).
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

/** Referință stabilă — `?? []` într-un selector creează un array nou la fiecare apel → re-render infinit. */
const EMPTY_MESSAGES: UIMessage[] = [];

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
  editAndResubmit: (messageId: string, text: string) => void;
}

const ChatViewContext = createContext<ChatViewValue | null>(null);

interface ChatSessionInnerProps {
  activeConversationId: string | null;
  initialMessages: UIMessage[];
  /** În afara `key` — altfel se pierde la remontare când createConversation schimbă id-ul. */
  pendingTextRef: RefObject<string | null>;
  children: React.ReactNode;
}

function ChatSessionInner({ activeConversationId, initialMessages, pendingTextRef, children }: ChatSessionInnerProps) {
  const profile = useAppStore(state => state.profile);
  const selectedProviderId = useAppStore(state => state.selectedProviderId);
  const selectedModel = useAppStore(state => state.selectedModel);
  const createConversation = useAppStore(state => state.createConversation);
  const renameConversation = useAppStore(state => state.renameConversation);
  const setConversationMessages = useAppStore(state => state.setConversationMessages);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  // Refs: body-ul transportului citește valoarea de la trimitere, nu pe cea de la mount.
  const providerIdRef = useRef(selectedProviderId);
  providerIdRef.current = selectedProviderId;

  const modelRef = useRef(selectedModel);
  modelRef.current = selectedModel;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          profile: profileRef.current,
          providerId: providerIdRef.current,
          model: modelRef.current
        })
      }),
    []
  );

  const { messages, sendMessage, status, stop, error, clearError, setMessages, regenerate } = useChat({
    id: activeConversationId ?? "new",
    messages: initialMessages,
    transport,
    onFinish: ({ messages: finishedMessages }) => {
      // O singură scriere la final: persist e sincron pe localStorage; per token = UI blocat.
      // Compromis: refresh în mijlocul stream-ului pierde răspunsul curent (până la persistența pe server).
      if (!activeConversationId) return;
      setConversationMessages(activeConversationId, finishedMessages);
    }
  });

  const isBusy = status === "submitted" || status === "streaming";

  // Primul send pe conversație abia creată: textul așteaptă remontarea cu noul id.
  useEffect(() => {
    const pending = pendingTextRef.current;
    if (!pending || !activeConversationId) return;
    pendingTextRef.current = null;
    void sendMessage({ text: pending }).then(() => {
      inputRef.current?.focus();
    });
  }, [activeConversationId, pendingTextRef, sendMessage]);

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

    // Titlul din store, nu din lista useChat — evităm subscribe pe tot conversations[].
    const conversation = useAppStore.getState().conversations.find(c => c.id === activeConversationId);
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
    messages.length,
    pendingTextRef,
    sendMessage
  ]);

  const startNewChat = useCallback(() => {
    // Golirea e distructivă pentru ecranul curent — confirmăm; arhiva conversației vechi rămâne în store.
    if (messages.length > 0) {
      const confirmed = window.confirm(
        "Începi o conversație nouă? Mesajele din chatul curent rămân salvate în lista din stânga."
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

  const editAndResubmit = useCallback(
    (messageId: string, text: string) => {
      // Fără tăiere, mesajele de după rămân și modelul primește un istoric cu două fire.
      if (isBusy) return;
      const index = messages.findIndex(message => message.id === messageId);
      if (index < 0) return;
      // sendMessage pune deja mesajul user în listă — nu ținem o a doua copie „optimistică”.
      setMessages(messages.slice(0, index));
      void sendMessage({ text }).then(() => {
        inputRef.current?.focus();
      });
    },
    [isBusy, messages, setMessages, sendMessage]
  );

  const exportConversation = useCallback(
    (format: ExportFormat) => {
      const conversation = useAppStore.getState().conversations.find(c => c.id === activeConversationId);
      const title = conversation?.title ?? "Conversație SkillForge";
      const payload = buildExportPayload(messages, profile, title);
      const content = format === "json" ? serializeExportJson(payload) : serializeExportMarkdown(payload);
      const filename = buildExportFilename(format === "json" ? "json" : "md");
      const mimeType = format === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8";
      downloadTextFile(filename, content, mimeType);
      toast.success(format === "json" ? "Export JSON descărcat" : "Export Markdown descărcat");
    },
    [activeConversationId, messages, profile]
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
      regenerateMessage,
      editAndResubmit
    }),
    [messages, isBusy, status, error, clearError, input, handleSend, stop, regenerateMessage, editAndResubmit]
  );

  return (
    <ChatSessionProvider value={sessionValue}>
      <ChatViewContext.Provider value={viewValue}>{children}</ChatViewContext.Provider>
    </ChatSessionProvider>
  );
}

export function ChatSessionRoot({ children }: { children: React.ReactNode }) {
  const activeConversationId = useAppStore(state => state.activeConversationId);
  // Selector pe referința mesajelor din arhivă — nu pe un obiect nou {a,b}.
  const archivedMessages = useAppStore(state => {
    if (!state.activeConversationId) return EMPTY_MESSAGES;
    return state.conversations.find(c => c.id === state.activeConversationId)?.messages ?? EMPTY_MESSAGES;
  });

  // pendingTextRef stă aici: ChatSessionInner se remontează la schimbarea id-ului.
  const pendingTextRef = useRef<string | null>(null);

  return (
    <ChatSessionInner
      key={activeConversationId ?? "new"}
      activeConversationId={activeConversationId}
      initialMessages={archivedMessages}
      pendingTextRef={pendingTextRef}
    >
      {children}
    </ChatSessionInner>
  );
}

export function Chat() {
  const props = useContext(ChatViewContext);
  if (!props) {
    throw new Error("Chat trebuie folosit în ChatSessionRoot");
  }

  const {
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
    regenerateMessage,
    editAndResubmit
  } = props;

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
          <MessageList
            isBusy={isBusy}
            messages={messages}
            onEdit={editAndResubmit}
            onRegenerate={regenerateMessage}
            status={status}
          />
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
