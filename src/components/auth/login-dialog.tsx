"use client";

/**
 * Fereastră de alegere a furnizorului — nu redirectare directă.
 * Cu un singur furnizor activ, un buton care pleacă instant pare că aplicația a decis;
 * cu fereastră, autentificarea e un pas al aplicației.
 */
import { useState } from "react";
import { signIn } from "next-auth/react";

import { GitHubMark, GoogleMark } from "@/components/auth/provider-marks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AUTH_UI_PROVIDERS, type AuthProviderId } from "@/lib/auth-providers";
import { cn } from "@/lib/utils";

const MARKS: Record<AuthProviderId, typeof GitHubMark> = {
  github: GitHubMark,
  google: GoogleMark
};

type LoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [pendingId, setPendingId] = useState<AuthProviderId | null>(null);

  const handleChoose = async (id: AuthProviderId, enabled: boolean) => {
    if (!enabled || pendingId) return;
    setPendingId(id);
    // callbackUrl: rămânem în app după OAuth (inclusiv după anulare tratată pe rută).
    await signIn(id, { callbackUrl: "/" });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Conectează-te</DialogTitle>
          <DialogDescription>
            Alege cum vrei să te autentifici. Nu inventăm parole — folosești un cont pe care îl ai deja.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {AUTH_UI_PROVIDERS.map(provider => {
            const Mark = MARKS[provider.id];
            const disabled = !provider.enabled || pendingId !== null;
            return (
              <Button
                aria-disabled={disabled}
                className={cn("relative h-11 w-full justify-start gap-3", !provider.enabled && "opacity-60")}
                disabled={disabled}
                key={provider.id}
                onClick={() => void handleChoose(provider.id, provider.enabled)}
                type="button"
                variant="outline"
              >
                <Mark className="size-5 shrink-0" />
                <span className="flex-1 text-left">
                  {pendingId === provider.id ? "Se redirecționează…" : `Continuă cu ${provider.name}`}
                </span>
                {!provider.enabled && provider.comingSoonLabel ? (
                  <span className="text-xs text-muted-foreground">{provider.comingSoonLabel}</span>
                ) : null}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
