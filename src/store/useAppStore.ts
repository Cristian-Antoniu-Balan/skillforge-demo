// Starea globală a aplicației — Zustand + persist ca lista de conversații să supraviețuiască refresh-ului.
// Mock-ul e doar valoarea inițială; la pasul următor înlocuim acțiunile (sendMessage) cu apeluri reale.
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { mockAssistantReplies, mockConversations, mockProviders } from "@/lib/mock/conversations";
import { mockProfile } from "@/lib/mock/profile";
import type { AppStore, Conversation, Message, Profile, ThemeMode } from "@/lib/types";

let typingTimeout: ReturnType<typeof setTimeout> | null = null;

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleFromMessage(content: string) {
  const trimmed = content.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed || "Conversație nouă";
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      profile: mockProfile,
      theme: "system",
      selectedProviderId: mockProviders[0].id,
      selectedModel: mockProviders[0].models[0],
      conversations: mockConversations,
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

      stopGeneration: () => {
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          typingTimeout = null;
        }
        set({ isTyping: false });
      },

      simulateLoading: () => {
        set({ isLoading: true, error: null });
        setTimeout(() => set({ isLoading: false }), 800);
      },

      sendMessage: content => {
        const trimmed = content.trim();
        if (!trimmed) return;

        const state = get();
        if (state.isTyping) return;

        let conversationId = state.activeConversationId;
        if (!conversationId) {
          conversationId = get().createConversation();
        }

        const userMessage: Message = {
          id: generateId("msg"),
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString()
        };

        set(current => ({
          conversations: current.conversations.map(c => {
            if (c.id !== conversationId) return c;
            const isFirst = c.messages.length === 0;
            return {
              ...c,
              title: isFirst ? titleFromMessage(trimmed) : c.title,
              messages: [...c.messages, userMessage],
              updatedAt: new Date().toISOString()
            };
          }),
          isTyping: true,
          error: null
        }));

        const replyIndex = Math.floor(Math.random() * mockAssistantReplies.length);
        typingTimeout = setTimeout(() => {
          const assistantMessage: Message = {
            id: generateId("msg"),
            role: "assistant",
            content: mockAssistantReplies[replyIndex],
            createdAt: new Date().toISOString()
          };

          set(current => ({
            conversations: current.conversations.map(c =>
              c.id === conversationId
                ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date().toISOString() }
                : c
            ),
            isTyping: false
          }));
          typingTimeout = null;
        }, 1500);
      }
    }),
    {
      name: "skillforge-app",
      partialize: state => ({
        profile: state.profile,
        theme: state.theme,
        selectedProviderId: state.selectedProviderId,
        selectedModel: state.selectedModel,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId
      })
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
