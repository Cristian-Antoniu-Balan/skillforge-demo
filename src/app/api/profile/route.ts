import { NextResponse } from "next/server";

import { requireOwnerId, PersistenceAuthError } from "@/lib/supabase/owner";
import { isPersistenceConfigured } from "@/lib/supabase/persistence";
import { updateProfileForOwner } from "@/lib/supabase/profiles";
import { isResponseStyle } from "@/lib/supabase/types";
import type { Profile, Skill } from "@/lib/types";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  if (!isPersistenceConfigured()) {
    return NextResponse.json({ error: "Persistența nu e configurată." }, { status: 503 });
  }

  try {
    const ownerId = await requireOwnerId();
    if (!ownerId) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const body = (await req.json()) as Partial<Profile>;
    const skills = Array.isArray(body.skills) ? (body.skills as Skill[]) : [];
    const responseStyle = isResponseStyle(body.responseStyle) ? body.responseStyle : "echilibrat";

    const profile = await updateProfileForOwner(ownerId, {
      name: typeof body.name === "string" ? body.name : "",
      stack: typeof body.stack === "string" ? body.stack : "",
      skills,
      objective: typeof body.objective === "string" ? body.objective : "",
      responseStyle
    });

    if (!profile) {
      return NextResponse.json({ error: "Nu am putut salva profilul." }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof PersistenceAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
