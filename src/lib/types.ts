// Tipuri partajate — un singur loc ca mock-ul, store-ul și UI-ul să vorbească aceeași limbă.
// La integrarea LLM, înlocuim doar sursa datelor, nu structura.
export type SkillLevel = "începător" | "intermediar" | "avansat";

export const SKILL_LEVELS: SkillLevel[] = ["începător", "intermediar", "avansat"];

export interface Skill {
  name: string;
  level: SkillLevel;
}

export interface Profile {
  name: string;
  stack: string;
  skills: Skill[];
  objective: string;
}

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = "system" | "light" | "dark";

export type SettingsTab = "general" | "profile" | "providers";

export interface ProviderConfig {
  id: string;
  name: string;
  models: string[];
}

export interface AppStore {
  profile: Profile;
  theme: ThemeMode;
  selectedProviderId: string;
  selectedModel: string;
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  settingsOpen: boolean;
  settingsTab: SettingsTab;

  setTheme: (theme: ThemeMode) => void;
  setProfile: (profile: Profile) => void;
  setSettingsOpen: (open: boolean) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  setSelectedProvider: (providerId: string, model: string) => void;
  setActiveConversation: (id: string | null) => void;
  createConversation: () => string;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  sendMessage: (content: string) => void;
  stopGeneration: () => void;
  clearError: () => void;
  simulateLoading: () => void;
}
