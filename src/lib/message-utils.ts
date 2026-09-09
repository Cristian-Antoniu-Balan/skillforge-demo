// Transformări peste mesaje — pure, fără store / DOM / fetch.
// Un singur loc pentru textul din parts: altfel JSON și UI se despart la prima modificare de format.
import type { UIMessage } from "ai";

import type { Profile } from "@/lib/types";

/** Structură intermediară: JSON și Markdown serializă din aceeași formă. */
export interface ExportPayload {
  exportedAt: string;
  profile: Profile;
  conversation: {
    title: string;
    messages: Array<{
      role: UIMessage["role"];
      content: string;
    }>;
  };
}

/** Singurul loc din proiect care citește textul unui UIMessage din parts. */
export function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(part => part.type === "text")
    .map(part => part.text)
    .join("");
}

export function buildExportPayload(
  messages: UIMessage[],
  profile: Profile,
  conversationTitle: string,
  exportedAt: Date = new Date()
): ExportPayload {
  return {
    exportedAt: exportedAt.toISOString(),
    profile,
    conversation: {
      title: conversationTitle,
      messages: messages.map(message => ({
        role: message.role,
        content: getMessageText(message)
      }))
    }
  };
}

export function serializeExportJson(payload: ExportPayload): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function serializeExportMarkdown(payload: ExportPayload): string {
  const skillLines =
    payload.profile.skills.length === 0
      ? "- (niciun skill)"
      : payload.profile.skills.map(skill => `- ${skill.name}: ${skill.level}`).join("\n");

  const messageBlocks = payload.conversation.messages
    .map(message => {
      const label = message.role === "user" ? "Utilizator" : "SkillForge";
      return `### ${label}\n\n${message.content || "_(gol)_"}`;
    })
    .join("\n\n");

  return [
    `# ${payload.conversation.title}`,
    "",
    `Exportat: ${payload.exportedAt}`,
    "",
    "## Profil",
    "",
    `- Nume: ${payload.profile.name}`,
    `- Stack: ${payload.profile.stack}`,
    `- Obiectiv: ${payload.profile.objective}`,
    "",
    "### Skills",
    "",
    skillLines,
    "",
    "## Conversație",
    "",
    messageBlocks || "_(niciun mesaj)_",
    ""
  ].join("\n");
}

/**
 * Nume de fișier sigur pentru download: fără diacritice/spații.
 * Titlul conversației nu intră brut — data ISO e suficientă și stabilă.
 */
export function buildExportFilename(extension: "json" | "md", date: Date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10);
  return `skillforge-${isoDate}.${extension}`;
}

/**
 * Declanșează download în browser. Nu e pură — stă aici ca să nu uităm revokeObjectURL
 * (fără revoke, fiecare export lasă o copie în memorie până la refresh).
 */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function isClipboardAvailable(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";
}
