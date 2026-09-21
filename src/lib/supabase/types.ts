/**
 * Tipuri DB ↔ store. ResponseStyle trăiește în @/lib/types (Profile) —
 * aici doar mapăm rândurile Postgres.
 */
import type { ChatUIMessage } from "@/lib/cost";
import type { Profile, ResponseStyle, Skill } from "@/lib/types";
import { RESPONSE_STYLES } from "@/lib/types";

export type { ResponseStyle };
export { RESPONSE_STYLES };

export function isResponseStyle(value: unknown): value is ResponseStyle {
  return typeof value === "string" && (RESPONSE_STYLES as string[]).includes(value);
}

/** Profil din DB = Profile din store; emailul rămâne coloană separată, în afara tipului. */
export type StoredProfile = Profile;

export interface StoredConversation {
  id: string;
  title: string;
  messages: ChatUIMessage[];
  technologyId: string | null;
  /** Rezumatul celor vechi — UI arată mesajele complete; modelul primește asta + fereastra. */
  summary: string | null;
  summaryUntilPosition: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  name: string;
  stack: string;
  skills: Skill[];
  objective: string;
  response_style: string;
  created_at: string;
}

export interface ConversationRow {
  id: string;
  owner_id: string;
  title: string;
  technology_id: string | null;
  summary: string | null;
  summary_until_position: number | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  owner_id: string;
  role: string;
  parts: ChatUIMessage["parts"];
  metadata: ChatUIMessage["metadata"] | null;
  position: number;
  created_at: string;
}

export function profileFromRow(row: ProfileRow): StoredProfile {
  return {
    name: row.name,
    stack: row.stack,
    skills: Array.isArray(row.skills) ? row.skills : [],
    objective: row.objective,
    responseStyle: isResponseStyle(row.response_style) ? row.response_style : "echilibrat"
  };
}

export function conversationFromRows(conversation: ConversationRow, messages: MessageRow[]): StoredConversation {
  const ordered = [...messages].sort((a, b) => a.position - b.position);
  return {
    id: conversation.id,
    title: conversation.title,
    technologyId: conversation.technology_id,
    summary: conversation.summary,
    summaryUntilPosition: conversation.summary_until_position,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    messages: ordered.map(row => ({
      id: row.id,
      role: row.role as ChatUIMessage["role"],
      parts: row.parts,
      ...(row.metadata ? { metadata: row.metadata } : {})
    }))
  };
}
