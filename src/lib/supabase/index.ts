import "server-only";

/**
 * Stratul de acces la date — componentele și rutele importă de aici, nu construiesc interogări.
 * Fiecare citire filtrează pe proprietarul din sesiunea citită pe server.
 */
export { getSupabase, hasSupabaseEnv } from "@/lib/supabase/client";
export { isPersistenceConfigured } from "@/lib/supabase/persistence";
export {
  deleteConversationForOwner,
  getConversationForOwner,
  listConversationsForOwner,
  replaceMessagesForOwner,
  updateConversationMetaForOwner,
  upsertConversationForOwner
} from "@/lib/supabase/conversations";
export { isEmailConfirmedByProvider, resolveIdentity, type ResolveIdentityResult } from "@/lib/supabase/identities";
export {
  MEMORY_WINDOW_SIZE,
  buildMemoryForModel,
  maybeRefreshConversationSummary,
  shouldRefreshSummary
} from "@/lib/supabase/memory";
export { getProfileForOwner, updateProfileForOwner } from "@/lib/supabase/profiles";
export type { ResponseStyle, StoredConversation, StoredProfile } from "@/lib/supabase/types";
export { RESPONSE_STYLES, isResponseStyle } from "@/lib/supabase/types";
