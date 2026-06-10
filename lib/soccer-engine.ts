// ============================================================
// 38-0 — The Engine
//
// Same architecture as 50-0 (and the viral 82-0 bundle): a
// deterministic weighted blend of position ratings mapped to
// wins through a steep non-linear curve. No RNG decides your
// record — only your draft does. RNG only flavors the fixture
// list (opponents, scorelines, match notes).
//
// The run: 38 matches from the first qualifier to the World Cup
// final. Losses land on the hardest fixtures — so a near-perfect
// XI dies in the knockout rounds, and only a flawless one lifts
// the trophy.
// ============================================================

import { POSITIONS, type PositionKey } from './soccer-data';

export const TOTAL_MATCHES = 38;
const CURVE_DENOM = 96; // squad rating needed for 38-0
const CURVE_EXP = 2.2;  // punishes weak XIs non-linearly
const SYNERGY_FLOOR = 75;
const SYNERGY_BONUS = 1.5; // "no weak link" bonus — a chain is its weakest position

export interface SlotFill {
  value: number;
  donor: string;
  donorNick: string;
  combo: string;
}
export type SoccerSlots = Record<PositionKey, SlotFill | null>;

export interface MatchRow {
  n: number;
  opponent: string;
  milestone: string | null;
  win: boolean;
  score: string;
  note: string;
}

export interface SeasonResult {
  wins: number;
  losses: number;
  overall: number;
  synergy: boolean;
  archetype: string;
  verdict: string;
  matches: MatchRow[];
}

export function overallFrom(slots: SoccerSlots): { overall: number; synergy: boolean } {
  let sum = 0;
  let min = 100;
  for (const p of POSITIONS) {
    const v = slots[p.key]?.value ?? 0;
    sum += v * p.weight;
    min = Math.min(min, v);
  }
  const synergy = min >= SYNERGY_FLOOR;
  const overall = Math.min(100, Math.round((sum + (synergy ? SYNERGY_BONUS : 0)) * 10) / 10);
  return { overall, synergy };
}

export function winsFrom(overall: number): number {
  return Math.round(TOTAL_MATCHES * Math.pow(Math.min(overall / CURVE_DENOM, 1), CURVE_EXP));
}

// ---------- flavor ----------

const ARCHETYPES: Record<PositionKey, string> = {
  gk:  'The Fortress — nothing gets past the last line',
  cb:  'The Wall — strikers retire trying',
  fb:  'The Overlap — the whole flank belongs to you',
  cm:  'The Metronome — every match played at your tempo',
  cam: 'The Maestro — passes nobody else even sees',
  wg:  'The Flash — full-backs see crosses in their nightmares',
  st:  'The Goal Machine — give an inch, concede a goal',
};

export function archetypeFor(slots: SoccerSlots, overall: number): string {
  if (overall >= CURVE_DENOM) return 'THE GREATEST TEAM EVER ASSEMBLED — flawless, era-proof, immortal';
  let bestKey: PositionKey = 'st';
  let bestVal = -1;
  for (const p of POSITIONS) {
    const v = slots[p.key]?.value ?? 0;
    if (v > bestVal) { bestVal = v; bestKey = p.key; }
  }
  return ARCHETYPES[bestKey];
}

// losses always land on the hardest (latest) fixtures, so the
// record maps cleanly onto how deep the run went
export function verdictFor(wins: number): string {
  if (wins >= 38) return 'WORLD CHAMPIONS. IMMORTAL.';
  if (wins >= 36) return 'BEATEN IN THE FINAL';
  if (wins >= 33) return 'SEMIFINALISTS';
  if (wins >= 29) return 'QUARTERFINALISTS';
  if (wins >= 24) return 'OUT IN THE ROUND OF 16';
  if (wins >= 19) return 'GROUP STAGE EXIT';
  return 'FAILED TO QUALIFY';
}

// ---------- fixture list generation ----------

// the gauntlet ends against history's giants
const GIANTS = [
  "Brazil '70", "Brazil '58", "Brazil '02", "Argentina '86", "Argentina '22",
  "Italy '82", "Italy '06", "West Germany '74", "West Germany '90", "Germany '14",
  "France '98", "France '18", "Spain '10", "Netherlands '74", "England '66",
  "Uruguay '50", "Hungary '54",
];
const CONTENDERS = [
  "Mexico '86", "Colombia '94", "Romania '94", "Bulgaria '94", "Sweden '58",
  "Poland '82", "Portugal '66", "Portugal '16", "Croatia '18", "Belgium '18",
  "Denmark '98", "Cameroon '90", "Nigeria '94", "Senegal '02", "Ghana '10",
  "Morocco '22", "Japan '22", "South Korea '02", "USA '30", "Chile '62",
  "Czechoslovakia '62", "Austria '34", "Peru '70", "Paraguay '10", "Russia '18",
  "Turkey '02", "Switzerland '54", "Scotland '78", "Ecuador '06", "Australia '06",
  "Costa Rica '14", "Algeria '14", "Ukraine '06", "Serbia '98", "Norway '98",
  "Ireland '90", "Northern Ireland '58", "Wales '58",
];

const WC_START = 30; // matches 31–38 are the tournament itself

const MILESTONES: Record<number, string> = {
  1: 'QUALIFYING BEGINS',
  6: 'AWAY AT ALTITUDE',
  10: 'CONTINENTAL DERBY',
  14: 'THE BOGEY TEAM',
  19: 'QUALIFICATION SEALED',
  24: 'MARQUEE FRIENDLY',
  28: 'WORLD CUP WARM-UP',
  31: 'WORLD CUP — GROUP STAGE',
  33: 'GROUP DECIDER',
  35: 'ROUND OF 16',
  36: 'QUARTERFINAL',
  37: 'SEMIFINAL',
  38: 'THE WORLD CUP FINAL',
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// how you lose follows your weakest position
const LOSS_BY_WEAKNESS: Record<PositionKey, { scores: string[]; note: string }> = {
  gk:  { scores: ['2–3', '1–2', '2–4'], note: 'goalkeeping howler' },
  cb:  { scores: ['0–2', '1–3', '0–3'], note: 'carved open at the back' },
  fb:  { scores: ['1–2', '0–2', '1–3'], note: 'overrun in the wide areas' },
  cm:  { scores: ['0–1', '0–2', '1–2'], note: 'lost the midfield battle' },
  cam: { scores: ['0–1', '0–1', '1–2'], note: 'no ideas in the final third' },
  wg:  { scores: ['0–1', '1–2', '0–1'], note: 'no width, no service' },
  st:  { scores: ['0–1', '0–1', '1–2'], note: 'twenty chances, none taken' },
};

const surname = (full: string) => full.split(' ').pop() ?? full;

export function simulateSeason(slots: SoccerSlots): SeasonResult {
  const { overall, synergy } = overallFrom(slots);
  const wins = winsFrom(overall);
  const losses = TOTAL_MATCHES - wins;

  const ratingOf = (k: PositionKey) => slots[k]?.value ?? 0;
  const donorOf = (k: PositionKey) => surname(slots[k]?.donor ?? 'the gaffer');

  // losses land on the hardest fixtures (the knockout rounds), with a little noise
  const difficulty = Array.from({ length: TOTAL_MATCHES }, (_, i) => ({
    idx: i,
    d: i + (MILESTONES[i + 1] ? 6 : 0) + Math.random() * 7,
  }));
  const lossIdx = new Set(
    difficulty.sort((a, b) => b.d - a.d).slice(0, losses).map(x => x.idx)
  );

  // weakest position decides how you lose
  let weakest: PositionKey = 'st';
  let weakestVal = 101;
  for (const p of POSITIONS) {
    const v = ratingOf(p.key);
    if (v < weakestVal) { weakestVal = v; weakest = p.key; }
  }

  // build determines how you win
  const atk = (ratingOf('st') + ratingOf('wg') + ratingOf('cam')) / 3;
  const def = (ratingOf('gk') + ratingOf('cb') + ratingOf('fb')) / 3;
  const goalsForPool = atk >= 92 ? [2, 3, 3, 4, 5] : atk >= 85 ? [1, 2, 2, 3, 4] : atk >= 75 ? [1, 2, 2, 3] : [1, 1, 2];
  const goalsAgainstPool = def >= 92 ? [0, 0, 0, 1] : def >= 85 ? [0, 0, 1] : def >= 75 ? [0, 1, 1] : [0, 1, 1, 2];

  const winNote = (gf: number, ga: number): string => {
    const options: string[] = [];
    const st = ratingOf('st'), wg = ratingOf('wg'), cam = ratingOf('cam'), cm = ratingOf('cm');
    if (gf >= 3 && st >= 85) options.push(`${donorOf('st')} hat-trick`, `${donorOf('st')} hat-trick`);
    if (gf >= 2 && st >= 80) options.push(`${donorOf('st')} brace`);
    if (st >= 75) options.push(`${donorOf('st')} with the winner`);
    if (wg >= 85) options.push(`${donorOf('wg')} tears the flank apart`, 'two assists off the wing');
    if (cam >= 85) options.push(`${donorOf('cam')} threads the killer pass`, `${donorOf('cam')} masterclass`);
    if (cm >= 85) options.push('total control of midfield', 'won it in second gear');
    if (ga === 0 && def >= 80) options.push('clean sheet, never threatened', `${donorOf('gk')} untouchable`);
    if (gf - ga === 1) options.push('dug out late', "a champion's grind");
    if (options.length === 0) options.push('three points, on to the next');
    return pick(options);
  };

  // qualifiers + friendlies draw from the contenders; the
  // tournament itself is eight straight all-time giants
  const roadPool = shuffled(CONTENDERS).slice(0, WC_START);
  const cupPool = shuffled(GIANTS).slice(0, TOTAL_MATCHES - WC_START);

  const matches: MatchRow[] = [];
  for (let i = 0; i < TOTAL_MATCHES; i++) {
    const name = i < WC_START ? roadPool[i] : cupPool[i - WC_START];

    const win = !lossIdx.has(i);
    let score: string;
    let note: string;
    if (win) {
      const gf = pick(goalsForPool);
      const ga = Math.min(pick(goalsAgainstPool), gf - 1);
      score = `${gf}–${ga}`;
      note = winNote(gf, ga);
    } else {
      const loss = LOSS_BY_WEAKNESS[weakest];
      score = pick(loss.scores);
      note = loss.note;
    }

    matches.push({
      n: i + 1,
      opponent: `vs. ${name}`,
      milestone: MILESTONES[i + 1] ?? null,
      win,
      score,
      note,
    });
  }

  return {
    wins,
    losses,
    overall,
    synergy,
    archetype: archetypeFor(slots, overall),
    verdict: verdictFor(wins),
    matches,
  };
}

export function shareText(result: SeasonResult, slots: SoccerSlots): string {
  const tier = (v: number) => (v >= 90 ? '🟩' : v >= 80 ? '🟨' : v >= 70 ? '🟧' : '🟥');
  const blocks = POSITIONS.map(p => tier(slots[p.key]?.value ?? 0)).join('');
  const crown = result.wins === TOTAL_MATCHES ? ' 🏆' : '';
  return [
    `38-0 · MY XI WENT ${result.wins}-${result.losses}${crown}`,
    blocks,
    `SQD ${result.overall} · ${result.verdict}`,
    'Build yours → 50-0.app/soccer',
  ].join('\n');
}
