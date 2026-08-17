-- Run this once in Supabase SQL Editor
create table if not exists public.travel_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.travel_state enable row level security;

drop policy if exists "travel_state_public_read" on public.travel_state;
drop policy if exists "travel_state_public_write" on public.travel_state;

-- Simple personal-use policy for this version.
-- Anyone who has your project anon key and URL can read/write this table.
-- For stronger security later, add Supabase Auth and restrict rows by user_id.
create policy "travel_state_public_read"
on public.travel_state for select
to anon
using (true);

create policy "travel_state_public_write"
on public.travel_state for all
to anon
using (true)
with check (true);

insert into public.travel_state(id,payload)
values ('default','{"trips":[],"expenses":[],"rate":0.22}'::jsonb)
on conflict (id) do nothing;
