-- SkillForge — schemă inițială (Faza 2: persistență + proprietar + memorie)
-- Rulează o singură dată în Supabase → SQL Editor.
-- Schimbările ulterioare = fișiere de migrare noi, nu editări pe acest fișier.

-- ---------------------------------------------------------------------------
-- profiles: proprietarul nostru (nu id-ul de la GitHub/Google).
-- Emailul e salvat aici pentru unirea conturilor, dar NU intră în tipul Profile
-- din aplicație și NU merge în system prompt (persistat ≠ trimis la model).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text,
  name text not null default '',
  stack text not null default '',
  skills jsonb not null default '[]'::jsonb,
  objective text not null default '',
  -- Preferință de stil: cât de detaliate să fie răspunsurile (intră în system prompt).
  response_style text not null default 'echilibrat',
  created_at timestamptz not null default now()
);

-- Un email confirmat → un singur profil (cheia de unire între furnizori).
-- NULL-urile nu se ciocnesc în UNIQUE (utilizatori fără email public = profiluri separate).
create unique index if not exists profiles_email_unique
  on public.profiles (email)
  where email is not null;

-- ---------------------------------------------------------------------------
-- identities: o linie per (furnizor, id la furnizor) → un profil.
-- provider_account_id e text: GitHub dă un număr, alții dau string — nu e uuid.
-- ---------------------------------------------------------------------------
create table if not exists public.identities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null,
  provider_account_id text not null,
  created_at timestamptz not null default now(),
  unique (provider, provider_account_id)
);

create index if not exists identities_profile_id_idx on public.identities (profile_id);

-- ---------------------------------------------------------------------------
-- conversations: oglindește Conversation din store (fără mesaje nested).
-- owner_id e profiles.id — din prima versiune, obligatoriu (nu se poate adăuga
-- NOT NULL pe rânduri existente fără migrare separată).
-- summary + summary_until_position: rezumatul se calculează o dată și se reînnoiește
-- doar când istoricul a crescut cu încă N mesaje (altfel plătim dublu la fiecare cerere).
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id text primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Conversație nouă',
  technology_id text,
  summary text,
  -- Ultimul position inclus în summary; null = încă nu s-a rezumat nimic.
  summary_until_position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_owner_id_idx on public.conversations (owner_id);

-- ---------------------------------------------------------------------------
-- messages: oglindește ChatUIMessage (parts + metadata); position e ordinea explicită.
-- Două mesaje pot avea același created_at (aceeași milisecundă) — fără position,
-- lista afișată într-o altă ordine e un bug greu de reprodus.
-- owner_id pe fiecare rând: filtrul pe proprietar e singura apărare cu service role.
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  parts jsonb not null default '[]'::jsonb,
  metadata jsonb,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (conversation_id, position)
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_owner_id_idx on public.messages (owner_id);

-- ---------------------------------------------------------------------------
-- RLS activat, deliberat fără politici.
-- Aplicația accesează datele doar de pe server, cu cheia de serviciu (ocoleste RLS).
-- Aceeași configurație, ajunsă aici din greșeală (client pe cheia anon fără politici),
-- e capcana clasică: merge pe service role, liste goale pe anon —
-- „merge la mine, în producție e gol”, cauza nicăieri în codul TypeScript.
-- Decizia (nu accidentul) e: browserul nu trebuie să citească aceste tabele.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.identities enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
