// Disponibilitatea e proprietate a serverului — browserul primește doar configured + reason.
// Fără valori de chei, nici trunchiate.
import { listProviderAvailability } from "@/lib/providers.server";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ providers: listProviderAvailability() });
}
