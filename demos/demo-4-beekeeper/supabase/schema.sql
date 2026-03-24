-- ============================================================
-- HiveTrack – Supabase Schema
-- Paste this entire file into: Supabase > SQL Editor > Run
-- ============================================================

-- ── Profiles (extends auth.users) ────────────────────────────────────────────

create table if not exists public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text not null,
  display_name text not null default '',
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles: authenticated users can read"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "profiles: users manage own row"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: users update own row"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Gardens (Apiary locations) ────────────────────────────────────────────────

create table if not exists public.gardens (
  id          uuid default gen_random_uuid() primary key,
  name        text not null check (char_length(trim(name)) between 1 and 80),
  location    text not null default '' check (char_length(location) <= 120),
  owner_id    uuid references auth.users(id) on delete cascade not null,
  owner_email text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.gardens enable row level security;

-- ── Garden collaborators ──────────────────────────────────────────────────────

create table if not exists public.garden_collaborators (
  garden_id    uuid references public.gardens(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  email        text not null,
  display_name text not null default '',
  added_at     timestamptz not null default now(),
  primary key (garden_id, user_id)
);
alter table public.garden_collaborators enable row level security;

-- ── Helper: can current user access a garden? ─────────────────────────────────

create or replace function public.can_access_garden(p_garden_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.gardens g
    where g.id = p_garden_id
      and (
        g.owner_id = auth.uid()
        or exists (
          select 1 from public.garden_collaborators gc
          where gc.garden_id = g.id and gc.user_id = auth.uid()
        )
      )
  );
$$;

-- ── Gardens RLS ───────────────────────────────────────────────────────────────

create policy "gardens: owner or collaborator can read"
  on public.gardens for select
  using (public.can_access_garden(id));

create policy "gardens: authenticated users can create"
  on public.gardens for insert
  with check (owner_id = auth.uid());

create policy "gardens: only owner can update"
  on public.gardens for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "gardens: only owner can delete"
  on public.gardens for delete
  using (owner_id = auth.uid());

-- ── Garden collaborators RLS ──────────────────────────────────────────────────

create policy "gc: accessible garden members can read"
  on public.garden_collaborators for select
  using (public.can_access_garden(garden_id));

create policy "gc: only garden owner can add collaborators"
  on public.garden_collaborators for insert
  with check (
    exists (select 1 from public.gardens g where g.id = garden_id and g.owner_id = auth.uid())
  );

create policy "gc: only garden owner can remove collaborators"
  on public.garden_collaborators for delete
  using (
    exists (select 1 from public.gardens g where g.id = garden_id and g.owner_id = auth.uid())
  );

-- ── Hives ─────────────────────────────────────────────────────────────────────

create table if not exists public.hives (
  id         uuid default gen_random_uuid() primary key,
  name       text not null check (char_length(trim(name)) between 1 and 80),
  garden_id  uuid references public.gardens(id) on delete cascade not null,
  owner_id   uuid references auth.users(id) on delete cascade not null,
  status     text not null default 'healthy'
             check (status in ('healthy', 'needs_attention', 'swarming', 'dormant')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hives enable row level security;

create policy "hives: accessible garden members can read"
  on public.hives for select
  using (public.can_access_garden(garden_id));

create policy "hives: accessible garden members can create"
  on public.hives for insert
  with check (owner_id = auth.uid() and public.can_access_garden(garden_id));

create policy "hives: accessible garden members can update"
  on public.hives for update
  using (public.can_access_garden(garden_id));

create policy "hives: accessible garden members can delete"
  on public.hives for delete
  using (public.can_access_garden(garden_id));

-- ── Inspections ───────────────────────────────────────────────────────────────

create table if not exists public.inspections (
  id          uuid default gen_random_uuid() primary key,
  hive_id     uuid references public.hives(id) on delete cascade not null,
  garden_id   uuid references public.gardens(id) on delete cascade not null,
  author_id   uuid references auth.users(id) on delete cascade not null,
  author_name text not null,
  message     text not null check (char_length(trim(message)) between 1 and 2000),
  timestamp   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
alter table public.inspections enable row level security;

create policy "inspections: accessible garden members can read"
  on public.inspections for select
  using (public.can_access_garden(garden_id));

create policy "inspections: accessible garden members can create"
  on public.inspections for insert
  with check (author_id = auth.uid() and public.can_access_garden(garden_id));

create policy "inspections: only author can delete"
  on public.inspections for delete
  using (author_id = auth.uid());

-- ── Realtime ──────────────────────────────────────────────────────────────────

-- Required for UPDATE/DELETE events to include changed row data
alter table public.gardens             replica identity full;
alter table public.hives               replica identity full;
alter table public.inspections         replica identity full;
alter table public.garden_collaborators replica identity full;

-- Add tables to the realtime publication
alter publication supabase_realtime add table
  public.profiles,
  public.gardens,
  public.garden_collaborators,
  public.hives,
  public.inspections;

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists idx_gardens_owner         on public.gardens(owner_id);
create index if not exists idx_gc_user               on public.garden_collaborators(user_id);
create index if not exists idx_hives_garden          on public.hives(garden_id);
create index if not exists idx_inspections_hive      on public.inspections(hive_id);
create index if not exists idx_inspections_garden    on public.inspections(garden_id);
create index if not exists idx_inspections_timestamp on public.inspections(timestamp desc);
create index if not exists idx_profiles_email        on public.profiles(email);
