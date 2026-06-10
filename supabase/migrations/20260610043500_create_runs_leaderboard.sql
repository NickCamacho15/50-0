-- 50-0 global leaderboard
-- Anonymous players post finished runs; everyone can read the top list.

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  fighter_name text not null check (char_length(fighter_name) between 1 and 18),
  wins integer not null check (wins between 0 and 50),
  losses integer not null check (losses between 0 and 50 and wins + losses = 50),
  overall numeric(4, 1) not null check (overall between 0 and 100),
  archetype text not null check (char_length(archetype) <= 60)
);

comment on table public.runs is 'Finished 50-0 runs posted to the global leaderboard';

create index runs_leaderboard_idx on public.runs (wins desc, overall desc, created_at asc);

alter table public.runs enable row level security;

-- anyone may read the leaderboard
create policy "leaderboard is public"
  on public.runs for select
  to anon, authenticated
  using (true);

-- anyone may post a run (insert only — no updates or deletes from clients)
create policy "anyone can post a run"
  on public.runs for insert
  to anon, authenticated
  with check (true);
