// Starea globală — profil, temă, sidebar. Mesajele chat trăiesc în useChat (Faza 1.3).
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { mockProviders } from "@/lib/mock/conversations";
import { mockProfile } from "@/lib/mock/profile";
import { DEFAULT_CHAT_MODEL, isAnthropicChatModel } from "@/lib/llm/models";
import type { AppStore, Conversation, Profile, ThemeMode } from "@/lib/types";

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
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

      // Păstrate pe tip pentru compatibilitate UI; generarea e în useChat + /api/chat.
      stopGeneration: () => set({ isTyping: false }),
      simulateLoading: () => {},
      sendMessage: () => {}
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
