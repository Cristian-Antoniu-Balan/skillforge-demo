/**
 * Mod persistență pe client — setat din bootstrap după /api/account.
 * Store-ul citește flag-ul în partialize: cu baza activă, profilul/conversațiile
 * nu mai stau în localStorage (sunt ale contului).
 */
let persistenceEnabled = false;

export function setClientPersistenceEnabled(enabled: boolean) {
  persistenceEnabled = enabled;
}

export function isClientPersistenceEnabled() {
  return persistenceEnabled;
}

/** Cheie: am arătat o dată că istoricul din browser nu se preia. */
export const LOCAL_HISTORY_NOTICE_KEY = "skillforge-local-history-notice-seen";
