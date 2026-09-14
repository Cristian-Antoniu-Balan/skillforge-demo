"use client";

// Comutator de moment lângă composer — nu e setare din Preferințe.
// Opțiunile vin DOAR din registru; disponibilitatea vine de pe server ca date de afișat.
// Un provider nou în providers.ts apare aici fără alte modificări.
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getProvider, PROVIDERS, type ProviderAvailability } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export function ProviderModelPicker() {
  const selectedProviderId = useAppStore(state => state.selectedProviderId);
  const selectedModel = useAppStore(state => state.selectedModel);
  const setSelectedProvider = useAppStore(state => state.setSelectedProvider);

  const [availability, setAvailability] = useState<ProviderAvailability[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Serverul decide cine e configurat — clientul nu atinge process.env.
    void fetch("/api/providers")
      .then(response => response.json())
      .then((data: { providers?: ProviderAvailability[] }) => {
        if (!cancelled) setAvailability(data.providers ?? []);
      })
      .catch(() => {
        // Fără status: lăsăm opțiunile active; /api/chat va răspunde 400 dacă lipsește cheia.
        if (!cancelled) setAvailability([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProvider = getProvider(selectedProviderId);
  const labelProvider = selectedProvider?.name ?? "Provider";

  const isConfigured = (providerId: string) => {
    // Până vine răspunsul, nu dezactivăm — altfel clipim pe „indisponibil" la fiecare refresh.
    if (!availability || availability.length === 0) return true;
    return availability.find(entry => entry.id === providerId)?.configured ?? false;
  };

  const reasonFor = (providerId: string) =>
    availability?.find(entry => entry.id === providerId)?.reason ?? "Provider neconfigurat.";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex max-w-[16rem] items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        type="button"
      >
        <span className="truncate">{labelProvider}</span>
        <span className="text-muted-foreground/70">·</span>
        <span className="truncate">{selectedModel}</span>
        <ChevronDown className="size-3 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[16rem]">
        {PROVIDERS.map((provider, index) => {
          const configured = isConfigured(provider.id);
          return (
            <div key={provider.id}>
              {index > 0 ? <DropdownMenuSeparator /> : null}
              {/* GroupLabel cere Menu.Group — fără el Base UI aruncă MenuGroupContext missing. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center justify-between gap-2">
                  <span>{provider.name}</span>
                  {!configured ? <span className="font-normal text-muted-foreground">neconfigurat</span> : null}
                </DropdownMenuLabel>
                {provider.models.map(modelId => {
                  const selected = selectedProviderId === provider.id && selectedModel === modelId;

                  // Rând separat (nu DropdownMenuItem disabled): pointer-events:none ar bloca tooltip-ul cu motivul.
                  if (!configured) {
                    return (
                      <Tooltip key={modelId}>
                        <TooltipTrigger
                          className={cn(
                            "flex w-full cursor-not-allowed items-center rounded-md px-1.5 py-1 text-left text-sm opacity-50"
                          )}
                          type="button"
                        >
                          <span className="truncate">{modelId}</span>
                        </TooltipTrigger>
                        <TooltipContent side="left">{reasonFor(provider.id)}</TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <DropdownMenuItem
                      className="justify-between gap-2"
                      key={modelId}
                      onClick={() => setSelectedProvider(provider.id, modelId)}
                    >
                      <span className="truncate">{modelId}</span>
                      {selected ? <Check className="size-3.5 shrink-0" /> : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
