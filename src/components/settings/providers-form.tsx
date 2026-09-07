"use client";

// Selector model Anthropic — același ID e trimis la POST /api/chat.
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { mockProviders, useAppStore } from "@/store/useAppStore";

export function ProvidersForm() {
  const selectedProviderId = useAppStore(state => state.selectedProviderId);
  const selectedModel = useAppStore(state => state.selectedModel);
  const setSelectedProvider = useAppStore(state => state.setSelectedProvider);

  const activeProvider = mockProviders.find(p => p.id === selectedProviderId) ?? mockProviders[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Providere</h2>
        <p className="text-sm text-muted-foreground">
          Modelul ales aici e cel folosit la generare (afișat și în caseta de chat).
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Provider</Label>
          <div className="flex flex-wrap gap-2">
            {mockProviders.map(provider => (
              <Button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id, provider.models[0])}
                size="sm"
                variant={selectedProviderId === provider.id ? "default" : "outline"}
              >
                {provider.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Model</Label>
          <div className="flex flex-wrap gap-2">
            {activeProvider.models.map(model => (
              <Button
                key={model}
                onClick={() => setSelectedProvider(activeProvider.id, model)}
                size="sm"
                variant={selectedModel === model ? "default" : "outline"}
              >
                {model}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
