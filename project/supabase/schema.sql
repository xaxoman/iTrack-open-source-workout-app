-- iTrack cloud sync schema
-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- It creates a single table that stores each user's entire app state as one
-- JSON blob (mirroring the local "Export Data" JSON), protected by Row Level
-- Security so users can only ever read/write their own row.

create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

-- Each user can only see and modify their own row.
drop policy if exists "Users manage their own data" on public.user_data;
create policy "Users manage their own data"
  on public.user_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
