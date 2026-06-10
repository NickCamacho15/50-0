-- 38-0 (soccer) global leaderboard
-- Same shape as the 50-0 runs table, scoped to a 38-match season.

create table public.soccer_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  squad_name text not null check (char_length(squad_name) between 1 and 18),
  wins integer not null check (wins between 0 and 38),
  losses integer not null check (losses between 0 and 38 and wins + losses = 38),
  overall numeric(4, 1) not null check (overall between 0 and 100),
  archetype text not null check (char_length(archetype) <= 60)
);

comment on table public.soccer_runs is 'Finished 38-0 seasons posted to the global leaderboard';

create index soccer_runs_leaderboard_idx on public.soccer_runs (wins desc, overall desc, created_at asc);

alter table public.soccer_runs enable row level security;

-- anyone may read the leaderboard
create policy "soccer leaderboard is public"
  on public.soccer_runs for select
  to anon, authenticated
  using (true);

-- anyone may post a run (insert only — no updates or deletes from clients)
create policy "anyone can post a soccer run"
  on public.soccer_runs for insert
  to anon, authenticated
  with check (true);
