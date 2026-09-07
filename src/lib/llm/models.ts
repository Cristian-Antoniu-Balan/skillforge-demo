// Singura listă de modele Anthropic active în Faza 1.3 — UI și /api/chat citesc de aici.
export const DEFAULT_CHAT_MODEL = "claude-haiku-4-5";

export const ANTHROPIC_CHAT_MODELS = ["claude-haiku-4-5", "claude-sonnet-4-20250514"] as const;

export type AnthropicChatModel = (typeof ANTHROPIC_CHAT_MODELS)[number];

export function isAnthropicChatModel(model: string): model is AnthropicChatModel {
  return (ANTHROPIC_CHAT_MODELS as readonly string[]).includes(model);
}
