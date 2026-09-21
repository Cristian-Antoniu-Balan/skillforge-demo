"use client";

/**
 * Încarcă datele contului când baza + auth sunt active.
 * Nu migrează localStorage — decizie: conversațiile locale nu au proprietar.
 */
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuthConfigured } from "@/components/auth/auth-providers";
import { LOCAL_HISTORY_NOTICE_KEY, setClientPersistenceEnabled } from "@/lib/persistence-mode";
import type { Conversation, Profile } from "@/lib/types";
import { mockProfile } from "@/lib/mock/profile";
import { useAppStore } from "@/store/useAppStore";

interface AccountResponse {
  persistenceEnabled: boolean;
  signedIn: boolean;
  profile: Profile | null;
  conversations: Conversation[];
  createdWithoutEmail: boolean;
}

export function PersistenceBootstrap({ children }: { children: React.ReactNode }) {
  const authConfigured = useAuthConfigured();
  // Hook doar sub SessionProvider — acest component e montat doar când auth e configurat.
  const { status } = useSession();
  const [ready, setReady] = useState(false);
  const loadedForUser = useRef<string | null>(null);

  const replaceAccountData = useAppStore(state => state.replaceAccountData);

  useEffect(() => {
    if (!authConfigured) {
      setClientPersistenceEnabled(false);
      setReady(true);
      return;
    }

    if (status === "loading") return;

    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/account");
        if (!response.ok) {
          setClientPersistenceEnabled(false);
          return;
        }
        const data = (await response.json()) as AccountResponse;
        if (cancelled) return;

        setClientPersistenceEnabled(data.persistenceEnabled && data.signedIn);

        if (data.persistenceEnabled && data.signedIn) {
          // Cont nou pe server: nu preluăm mock-ul local ca „profil al contului”.
          replaceAccountData({
            profile: data.profile ?? {
              name: "",
              stack: "",
              skills: [],
              objective: "",
              responseStyle: "echilibrat"
            },
            conversations: data.conversations,
            activeConversationId: data.conversations[0]?.id ?? null
          });
          loadedForUser.current = "signed-in";

          // O singură dată: istoricul din browser nu se importă.
          if (typeof window !== "undefined" && !localStorage.getItem(LOCAL_HISTORY_NOTICE_KEY)) {
            localStorage.setItem(LOCAL_HISTORY_NOTICE_KEY, "1");
            toast.info(
              "Conversațiile salvate doar în acest browser nu se preiau pe cont. Istoricul din cont pornește de aici."
            );
          }

          if (data.createdWithoutEmail) {
            toast.warning(
              "Furnizorul nu ne-a trimis un email confirmat. Fără email, un alt login (ex. alt furnizor) poate crea un al doilea profil, fără conversațiile de acum."
            );
          }
        } else if (data.persistenceEnabled && !data.signedIn) {
          // Deconectat cu baza activă: golim arhiva de cont din memorie (nu e a browserului).
          if (loadedForUser.current === "signed-in") {
            replaceAccountData({
              profile: mockProfile,
              conversations: [],
              activeConversationId: null
            });
            loadedForUser.current = "signed-out";
          }
        }
      } catch (error) {
        console.error("[persistence] bootstrap", error);
        setClientPersistenceEnabled(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [authConfigured, status, replaceAccountData]);

  if (!ready && authConfigured) {
    return <div className="flex h-svh items-center justify-center text-sm text-muted-foreground">Se încarcă contul…</div>;
  }

  return <>{children}</>;
}

/** Când auth nu e configurat, nu montăm useSession — doar marcăm persistența oprită. */
export function PersistenceBootstrapLocal({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setClientPersistenceEnabled(false);
  }, []);
  return <>{children}</>;
}
