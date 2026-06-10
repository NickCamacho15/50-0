import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Leaderboard is optional — the game works fully offline without it.
let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}

export interface LeaderboardRow {
  fighter_name: string;
  wins: number;
  losses: number;
  overall: number;
  archetype: string;
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('runs')
    .select('fighter_name, wins, losses, overall, archetype')
    .order('wins', { ascending: false })
    .order('overall', { ascending: false })
    .limit(10);
  if (error) return null;
  return data as LeaderboardRow[];
}

export async function postRun(row: LeaderboardRow): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('runs').insert(row);
  return !error;
}
