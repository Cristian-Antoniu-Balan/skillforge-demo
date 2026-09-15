// Filtrare conversații după text — pure, fără store / DOM / fetch.
// Pe moment scan local (regex pe conținut); ulterior query în DB.
import type { UIMessage } from "ai";

import { getMessageText } from "@/lib/message-utils";
import type { Conversation } from "@/lib/types";

/** Limita curentă pentru câmpul „Search for”; alte reguli vin ulterior. */
export const CONVERSATION_SEARCH_MAX_LENGTH = 20;

/**
 * Compilează pattern-ul din input ca RegExp.
 * Returnează null pentru query gol sau pattern invalid (ex. `[` neterminat).
 */
export function tryCompileSearchRegex(query: string): RegExp | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    return new RegExp(trimmed, "gi");
  } catch {
    return null;
  }
}

/** Textul agregat al unei conversații — același corpus pe care îl caută filtrul. */
export function getConversationSearchableText(conversation: Conversation): string {
  return conversation.messages.map((message: UIMessage) => getMessageText(message)).join("\n");
}

/**
 * True dacă conversația se potrivește cu query-ul (sau query-ul e gol → toate trec).
 * Pattern invalid → nicio potrivire (lista rămâne goală până la clear / text valid).
 */
export function conversationMatchesSearch(conversation: Conversation, query: string): boolean {
  // TODO: filtrare în DB după conținutul conversațiilor (nu scan local pe messages din store).
  const trimmed = query.trim();
  if (!trimmed) return true;

  const regex = tryCompileSearchRegex(trimmed);
  if (!regex) return false;

  return regex.test(getConversationSearchableText(conversation));
}

export type HighlightSegment = { text: string; match: boolean };

/** Împarte textul în segmente match / non-match pentru highlight în UI. */
export function splitBySearchHighlight(text: string, query: string): HighlightSegment[] {
  const regex = tryCompileSearchRegex(query);
  if (!regex || !text) {
    return text ? [{ text, match: false }] : [];
  }

  // `g` pe același RegExp mută lastIndex — clonăm pentru matchAll.
  const globalRegex = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`);
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(globalRegex)) {
    const start = match.index ?? 0;
    const matched = match[0];
    if (!matched) continue;
    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start), match: false });
    }
    segments.push({ text: matched, match: true });
    lastIndex = start + matched.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), match: false });
  }

  return segments.length > 0 ? segments : [{ text, match: false }];
}
