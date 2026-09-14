"use client";

// Preferințe → Providere: status chei + reminder că comutatorul e în composer.
// Lista vine din registru — fără if pe providerId; un provider nou apare singur.
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { PROVIDERS, type ProviderAvailability } from "@/lib/providers";

export function ProvidersForm() {
  const [availability, setAvailability] = useState<ProviderAvailability[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/providers")
      .then(response => response.json())
      .then((data: { providers?: ProviderAvailability[] }) => {
        if (!cancelled) setAvailability(data.providers ?? []);
      })
      .catch(() => {
        if (!cancelled) setAvailability([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statusFor = (providerId: string) => availability?.find(entry => entry.id === providerId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Providere</h2>
        <p className="text-sm text-muted-foreground">
          Comutatorul pentru mesajul următor stă lângă caseta de chat. Aici vezi doar dacă cheia e setată pe server
          (fără a expune valoarea).
        </p>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map(provider => {
          const status = statusFor(provider.id);
          const configured = status?.configured ?? false;
          return (
            <div className="space-y-2 rounded-lg border p-3" key={provider.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{provider.name}</div>
                {availability ? (
                  <Badge variant={configured ? "default" : "secondary"}>
                    {configured ? "configurat" : "neconfigurat"}
                  </Badge>
                ) : (
                  <Badge variant="outline">se verifică…</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Modele: {provider.models.join(", ")} · env: {provider.envKey}
              </p>
              {status && !status.configured && status.reason ? (
                <p className="text-xs text-muted-foreground">{status.reason}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
