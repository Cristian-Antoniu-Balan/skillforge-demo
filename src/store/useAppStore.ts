// Starea globală persistentă — arhiva conversațiilor, profil, provider.
// Tema NU stă aici: are Context + cheie localStorage proprie (skillforge-theme).
//
// Cine deține mesajele (Faza 1.6):
// - În timpul streamingului: useChat (construiește token cu token; nu scriem în persist).
// - După stream: store-ul e arhiva (lista + mesaje), scrisă o singură dată la onFinish.
//
// De ce Zustand aici și nu doar Context: mesajele / lista se schimbă des și sunt citite din
// sidebar, header, settings, chat. Context fără selectors re-randează pe orice schimbare;
// store-ul permite selectori pe câmp. Context rămâne potrivit pentru valori rare cu puțini
// consumatori (temă; sesiunea useChat) — vezi theme-provider.tsx / chat-session-context.tsx.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UIMessage } from "ai";

import { mockProfile } from "@/lib/mock/profile";
import { DEFAULT_TECHNOLOGIES } from "@/lib/mock/technologies";
import { DEFAULT_CHAT_MODEL, DEFAULT_PROVIDER_ID, isKnownModel, PROVIDERS } from "@/lib/providers";
import type { AppStore, Conversation, DeleteTechnologyResult, Message, Profile, TechnologyTag } from "@/lib/types";

/** Versiunea stării din localStorage — orice schimbare de formă cere increment + migrate. */
export const APP_STORE_VERSION = 2;

/** Limita curentă pentru numele unui tag; alte reguli vin ulterior. */
export const TECHNOLOGY_TAG_MAX_LENGTH = 20;

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Sortare alfabetică crescătoare pe etichetă — UI și liste derivate. */
export function sortTechnologies(technologies: TechnologyTag[]): TechnologyTag[] {
  return [...technologies].sort((a, b) => a.tag.localeCompare(b.tag, "ro", { sensitivity: "base" }));
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
  "profile" | "selectedProviderId" | "selectedModel" | "technologies" | "conversations" | "activeConversationId"
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

  // v1 → v2: tehnologii + technologyId pe conversații.
  if (version < 2) {
    // TODO: preluare lista de tehnologii din DB (nu hardcodat).
    if (!Array.isArray(state.technologies) || state.technologies.length === 0) {
      state.technologies = DEFAULT_TECHNOLOGIES;
    }
    if (Array.isArray(state.conversations)) {
      state.conversations = state.conversations.map(conversation => ({
        ...conversation,
        technologyId: conversation.technologyId ?? null
      }));
    }
  }

  return state;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      profile: mockProfile,
      // Implicit = primul din registru (Anthropic) — pe creditele lui rulează cursul.
      selectedProviderId: DEFAULT_PROVIDER_ID,
      selectedModel: DEFAULT_CHAT_MODEL,
      // TODO: preluare lista de tehnologii din DB (nu hardcodat).
      technologies: DEFAULT_TECHNOLOGIES,
      conversations: [],
      activeConversationId: null,
      isLoading: false,
      isTyping: false,
      error: null,
      settingsOpen: false,
      settingsTab: "general",

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
          technologyId: null,
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

      setConversationTechnology: (conversationId, technologyId) =>
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === conversationId ? { ...c, technologyId, updatedAt: new Date().toISOString() } : c
          )
        })),

      addTechnology: tag => {
        const id = generateId("tech");
        const entry: TechnologyTag = { id, tag: tag.trim() };
        set(state => ({ technologies: [...state.technologies, entry] }));
        return id;
      },

      updateTechnology: (id, tag) =>
        set(state => ({
          technologies: state.technologies.map(t => (t.id === id ? { ...t, tag: tag.trim() } : t))
        })),

      deleteTechnology: (id): DeleteTechnologyResult => {
        const inUse = get().conversations.some(c => c.technologyId === id);
        if (inUse) {
          return { ok: false, reason: "in_use" };
        }
        set(state => ({
          technologies: state.technologies.filter(t => t.id !== id)
        }));
        return { ok: true };
      },

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
        // Tema are cheie proprie (skillforge-theme) — nu o amestecăm aici.
        profile: state.profile,
        selectedProviderId: state.selectedProviderId,
        selectedModel: state.selectedModel,
        technologies: state.technologies,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId
      }),
      // localStorage vechi poate avea id-uri scoase din registru — le aducem la o pereche validă.
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<AppStore>) };
        if (!isKnownModel(merged.selectedProviderId, merged.selectedModel)) {
          const fallback = PROVIDERS.find(p => p.id === merged.selectedProviderId) ?? PROVIDERS[0];
          merged.selectedProviderId = fallback.id;
          merged.selectedModel = fallback.defaultModelId;
        }
        // Persist fără technologies (sau gol) → seed din mock la încărcare.
        // TODO: preluare lista de tehnologii din DB (nu hardcodat).
        if (!Array.isArray(merged.technologies) || merged.technologies.length === 0) {
          merged.technologies = DEFAULT_TECHNOLOGIES;
        }
        return merged;
      }
    }
  )
);

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
