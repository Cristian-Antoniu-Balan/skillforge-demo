// Starea globală persistentă — arhiva conversațiilor, profil, temă, provider.
//
// Cine deține mesajele (Faza 1.6):
// - În timpul streamingului: useChat (construiește token cu token; nu scriem în persist).
// - După stream: store-ul e arhiva (lista + mesaje), scrisă o singură dată la onFinish.
//
// De ce Zustand aici și nu doar Context: mesajele / lista se schimbă des și sunt citite din
// sidebar, header, settings, chat. Context fără selectors re-randează pe orice schimbare;
// store-ul permite selectori pe câmp. Context rămâne potrivit pentru valori rare cu puțini
// consumatori (ex. sesiunea useChat ridicată peste layout) — vezi chat-session-context.tsx.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UIMessage } from "ai";

import { mockProviders } from "@/lib/mock/conversations";
import { mockProfile } from "@/lib/mock/profile";
import { DEFAULT_CHAT_MODEL, isAnthropicChatModel } from "@/lib/llm/models";
import type { AppStore, Conversation, Message, Profile, ThemeMode } from "@/lib/types";

/** Versiunea stării din localStorage — orice schimbare de formă cere increment + migrate. */
export const APP_STORE_VERSION = 1;

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Transformă mesajul vechi (content: string) în UIMessage (parts) — fără ea, refresh-ul crapă în UI. */
function toUIMessage(message: unknown): UIMessage {
  if (
    typeof message === "object" &&
    message !== null &&
    "parts" in message &&
    Array.isArray((message as UIMessage).parts)
  ) {
    return message as UIMessage;
  }

  const legacy = message as Partial<Message>;
  return {
    id: typeof legacy.id === "string" ? legacy.id : generateId("msg"),
    role: legacy.role === "assistant" || legacy.role === "user" ? legacy.role : "assistant",
    parts: [{ type: "text", text: typeof legacy.content === "string" ? legacy.content : "" }]
  };
}

type PersistedSlice = Pick<
  AppStore,
  "profile" | "theme" | "selectedProviderId" | "selectedModel" | "conversations" | "activeConversationId"
>;

function migratePersistedState(persistedState: unknown, version: number): PersistedSlice {
  const state = persistedState as PersistedSlice;

  // v0 → v1: Conversation.messages trece de la Message[] la UIMessage[].
  if (version < 1 && Array.isArray(state.conversations)) {
    state.conversations = state.conversations.map(conversation => ({
      ...conversation,
      messages: (conversation.messages as unknown[]).map(toUIMessage)
    }));
  }

  return state;
}

export const useAppStore = create<AppStore>()(
  persist(
    set => ({
      profile: mockProfile,
      theme: "system",
      selectedProviderId: mockProviders[0].id,
      selectedModel: mockProviders[0].models[0],
      conversations: [],
      activeConversationId: null,
      isLoading: false,
      isTyping: false,
      error: null,
      settingsOpen: false,
      settingsTab: "general",

      setTheme: theme => set({ theme }),
      setProfile: profile => set({ profile }),
      setSettingsOpen: settingsOpen => set({ settingsOpen }),
      setSettingsTab: settingsTab => set({ settingsTab }),
      setSelectedProvider: (providerId, model) => set({ selectedProviderId: providerId, selectedModel: model }),
      setActiveConversation: activeConversationId => set({ activeConversationId, error: null }),
      clearError: () => set({ error: null }),

      createConversation: () => {
        const id = generateId("conv");
        const now = new Date().toISOString();
        const conversation: Conversation = {
          id,
          title: "Conversație nouă",
          messages: [],
          createdAt: now,
          updatedAt: now
        };
        set(state => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
          error: null
        }));
        return id;
      },

      renameConversation: (id, title) =>
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
          )
        })),

      deleteConversation: id =>
        set(state => {
          const conversations = state.conversations.filter(c => c.id !== id);
          const activeConversationId =
            state.activeConversationId === id ? (conversations[0]?.id ?? null) : state.activeConversationId;
          return { conversations, activeConversationId };
        }),

      setConversationMessages: (id, messages) =>
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === id ? { ...c, messages, updatedAt: new Date().toISOString() } : c
          )
        })),

      // Păstrate pe tip pentru compatibilitate UI; generarea e în useChat + /api/chat.
      stopGeneration: () => set({ isTyping: false }),
      simulateLoading: () => {},
      sendMessage: () => {}
    }),
    {
      name: "skillforge-app",
      version: APP_STORE_VERSION,
      migrate: migratePersistedState,
      // Fără skipHydration, primul render pe client vede conversations=[] înainte de localStorage
      // și orice logică pe „listă goală" creează o conversație nouă la fiecare refresh.
      skipHydration: true,
      partialize: (state): PersistedSlice => ({
        // Doar ce trebuie să supraviețuiască refresh-ului.
        // isLoading / isTyping / error / settingsOpen rămân în memorie: altfel redeschizi
        // aplicația pe „se încarcă…" sau pe o eroare de acum trei zile.
        profile: state.profile,
        theme: state.theme,
        selectedProviderId: state.selectedProviderId,
        selectedModel: state.selectedModel,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId
      }),
      // localStorage vechi poate avea OpenAI / ID-uri scoase — aliniem la modelele reale din /api/chat
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<AppStore>) };
        if (!isAnthropicChatModel(merged.selectedModel)) {
          merged.selectedModel = DEFAULT_CHAT_MODEL;
          merged.selectedProviderId = "anthropic";
        }
        return merged;
      }
    }
  )
);

export { mockProviders };

export function skillsToText(skills: Profile["skills"]) {
  return skills.map(s => `${s.name}: ${s.level}`).join("\n");
}

export function textToSkills(text: string): Profile["skills"] {
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [name, level] = line.split(":").map(part => part.trim());
      const validLevel = ["începător", "intermediar", "avansat"].includes(level)
        ? (level as Profile["skills"][0]["level"])
        : "începător";
      return { name: name || "Skill", level: validLevel };
    });
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}
