"use client";

// Așteaptă hidratarea Zustand din localStorage înainte de orice decizie pe listă/mesaje.
import { useEffect, useState } from "react";

import { useAppStore } from "@/store/useAppStore";

/**
 * True abia după ce persist a citit localStorage.
 * De ce e necesar: starea implicită e conversations=[] — reacția la „listă goală"
 * înainte de hidratare creează o conversație nouă la fiecare încărcare de pagină.
 */
export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubFinish = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    void useAppStore.persist.rehydrate();

    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsubFinish;
  }, []);

  return hydrated;
}
