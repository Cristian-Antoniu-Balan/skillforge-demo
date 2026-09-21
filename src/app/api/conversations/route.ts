import { NextResponse } from "next/server";

import {
  deleteConversationForOwner,
  listConversationsForOwner,
  updateConversationMetaForOwner,
  upsertConversationForOwner
} from "@/lib/supabase/conversations";
import { requireOwnerId, PersistenceAuthError } from "@/lib/supabase/owner";
import { isPersistenceConfigured } from "@/lib/supabase/persistence";

export const runtime = "nodejs";

export async function GET() {
  if (!isPersistenceConfigured()) {
    return NextResponse.json({ conversations: [] });
  }

  try {
    const ownerId = await requireOwnerId();
    if (!ownerId) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const conversations = await listConversationsForOwner(ownerId);
    return NextResponse.json({ conversations });
  } catch (error) {
    if (error instanceof PersistenceAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(req: Request) {
  if (!isPersistenceConfigured()) {
    return NextResponse.json({ error: "Persistența nu e configurată." }, { status: 503 });
  }

  try {
    const ownerId = await requireOwnerId();
    if (!ownerId) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const body = (await req.json()) as {
      id: string;
      title?: string;
      technologyId?: string | null;
      createdAt?: string;
      updatedAt?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Lipsește id-ul conversației." }, { status: 400 });
    }

    const ok = await upsertConversationForOwner(ownerId, {
      id: body.id,
      title: body.title ?? "Conversație nouă",
      technologyId: body.technologyId ?? null,
      createdAt: body.createdAt,
      updatedAt: body.updatedAt
    });

    if (!ok) {
      return NextResponse.json({ error: "Nu am putut salva conversația." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PersistenceAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(req: Request) {
  if (!isPersistenceConfigured()) {
    return NextResponse.json({ error: "Persistența nu e configurată." }, { status: 503 });
  }

  try {
    const ownerId = await requireOwnerId();
    if (!ownerId) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const body = (await req.json()) as {
      id: string;
      title?: string;
      technologyId?: string | null;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Lipsește id-ul conversației." }, { status: 400 });
    }

    const ok = await updateConversationMetaForOwner(ownerId, body.id, {
      title: body.title,
      technologyId: body.technologyId
    });

    if (!ok) {
      return NextResponse.json({ error: "Nu am putut actualiza conversația." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PersistenceAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(req: Request) {
  if (!isPersistenceConfigured()) {
    return NextResponse.json({ error: "Persistența nu e configurată." }, { status: 503 });
  }

  try {
    const ownerId = await requireOwnerId();
    if (!ownerId) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Lipsește id-ul conversației." }, { status: 400 });
    }

    const ok = await deleteConversationForOwner(ownerId, id);
    if (!ok) {
      return NextResponse.json({ error: "Nu am putut șterge conversația." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PersistenceAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
