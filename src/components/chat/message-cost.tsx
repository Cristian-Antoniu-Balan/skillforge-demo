"use client";

// Cost discret lângă răspuns — o informație, nu o alarmă.
// Intrare = istoricul retrimis (context); ieșire = textul generat acum.
import type { ChatMessageMetadata } from "@/lib/cost";
import { formatUsd } from "@/lib/cost";
import { cn } from "@/lib/utils";

interface MessageCostProps {
  metadata: ChatMessageMetadata | undefined;
  className?: string;
}

export function MessageCost({ metadata, className }: MessageCostProps) {
  if (!metadata) return null;

  if (metadata.fromCache) {
    return <p className={cn("px-1 text-[11px] text-muted-foreground/80", className)}>din cache · {formatUsd(0)}</p>;
  }

  const hasTokens = metadata.inputTokens !== undefined || metadata.outputTokens !== undefined;
  const hasCost = metadata.inputCostUsd !== undefined || metadata.outputCostUsd !== undefined;
  if (!hasTokens && !hasCost) return null;

  const total =
    metadata.inputCostUsd !== undefined && metadata.outputCostUsd !== undefined
      ? metadata.inputCostUsd + metadata.outputCostUsd
      : undefined;

  const inputLabel =
    metadata.inputTokens !== undefined
      ? `${metadata.inputTokens} in · ${formatUsd(metadata.inputCostUsd)}`
      : `in · ${formatUsd(undefined)}`;
  const outputLabel =
    metadata.outputTokens !== undefined
      ? `${metadata.outputTokens} out · ${formatUsd(metadata.outputCostUsd)}`
      : `out · ${formatUsd(undefined)}`;

  return (
    <p
      className={cn("px-1 text-[11px] text-muted-foreground/80", className)}
      title="Cost estimat din usage-ul providerului"
    >
      {/* „in" = contextul retrimis; pe chat lung aici cresc banii, nu la lungimea întrebării. */}
      {inputLabel}
      <span className="mx-1 opacity-50">·</span>
      {outputLabel}
      <span className="mx-1 opacity-50">·</span>
      total {formatUsd(total)}
    </p>
  );
}
