// ============================================================
// 50-0 — The Engine
//
// A deterministic multi-factor model. The headline rating blends
// weighted skill, a harmonic mean, the two weakest traits, and the
// weakest phase of the fight. Holes and wild imbalance are penalized.
// RNG only flavors fight cards; the draft alone decides the record.
// ============================================================

import { TRAITS, type TraitKey } from './data';

export const TOTAL_FIGHTS = 50;
export const PERFECT_SCORE = 98.5;
export const PERFECT_FLOOR = 90;
export const ELITE_TRAIT = 94;
export const PERFECT_ELITE_COUNT = 5;

const CURVE_EXP = 3.05;
const SYNERGY_FLOOR = 82;
const SYNERGY_MAX_SPREAD = 8;
const SYNERGY_BONUS = 0.4;

export interface SlotFill {
  value: number;
  donor: string;
  donorNick: string;
  combo: string;
}
export type Slots = Record<TraitKey, SlotFill | null>;

export interface FightRow {
  n: number;
  opponent: string;
  milestone: string | null;
  win: boolean;
  method: string;
  round: number;
  time: string;
}

export interface RunResult {
  wins: number;
  losses: number;
  overall: number;
  synergy: boolean;
  floor: number;
  domainFloor: number;
  eliteTraits: number;
  perfectEligible: boolean;
  archetype: string;
  verdict: string;
  fights: FightRow[];
}

export interface ScoreBreakdown {
  overall: number;
  synergy: boolean;
  floor: number;
  domainFloor: number;
  eliteTraits: number;
  perfectEligible: boolean;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function overallFrom(slots: Slots): ScoreBreakdown {
  const values = TRAITS.map(t => slots[t.key]?.value ?? 0);
  const sorted = [...values].sort((a, b) => a - b);
  const weighted = TRAITS.reduce((sum, t) => sum + (slots[t.key]?.value ?? 0) * t.weight, 0);
  const harmonic = 1 / TRAITS.reduce((sum, t) => {
    const value = Math.max(slots[t.key]?.value ?? 0, 1);
    return sum + t.weight / value;
  }, 0);
  const weakestTwo = (sorted[0] + sorted[1]) / 2;

  // A fighter must survive every phase. Geometric means stop one
  // spectacular trait from completely carrying its related phase.
  const standup = Math.sqrt(values[0] * values[1]);
  const grappling = Math.sqrt(values[2] * values[3]);
  const championship = Math.cbrt(values[4] * values[5] * values[6]);
  const domainFloor = Math.min(standup, grappling, championship);

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const deviation = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
  const holePenalty = values.reduce((sum, v) => sum + Math.max(0, SYNERGY_FLOOR - v) * 0.12, 0);
  const spreadPenalty = Math.max(0, deviation - SYNERGY_MAX_SPREAD) * 0.15;
  const floor = sorted[0];
  const eliteTraits = values.filter(v => v >= ELITE_TRAIT).length;
  const synergy = floor >= SYNERGY_FLOOR && deviation <= SYNERGY_MAX_SPREAD;

  const foundation = weighted * 0.5 + harmonic * 0.25 + weakestTwo * 0.15 + domainFloor * 0.1;
  const overall = Math.min(99.9, Math.max(0, round1(
    foundation - holePenalty - spreadPenalty + (synergy ? SYNERGY_BONUS : 0),
  )));
  const perfectEligible = overall >= PERFECT_SCORE
    && floor >= PERFECT_FLOOR
    && eliteTraits >= PERFECT_ELITE_COUNT;

  return { overall, synergy, floor, domainFloor: round1(domainFloor), eliteTraits, perfectEligible };
}

export function winsFrom(overall: number, perfectEligible = overall >= PERFECT_SCORE): number {
  const projected = Math.round(
    TOTAL_FIGHTS * Math.pow(Math.min(overall / PERFECT_SCORE, 1), CURVE_EXP),
  );
  return perfectEligible ? projected : Math.min(TOTAL_FIGHTS - 1, projected);
}

// ---------- flavor ----------

const ARCHETYPES: Record<TraitKey, string> = {
  str: 'The Sniper — surgical violence on the feet',
  pow: 'The One-Punch Nightmare — lights out, any second',
  wre: 'The Blanket — you will wrestle, and you will lose',
  gra: 'The Anaconda — every exchange ends in a choke',
  car: 'The Engine — drowns opponents in the deep water',
  chn: 'The Zombie — walks through hell and smiles',
  iq:  'The Professor — solves you in one round',
};

export function archetypeFor(slots: Slots, overall: number): string {
  if (overall >= PERFECT_SCORE) return 'THE GOAT — flawless, era-proof, inevitable';
  let bestKey: TraitKey = 'str';
  let bestVal = -1;
  for (const t of TRAITS) {
    const v = slots[t.key]?.value ?? 0;
    if (v > bestVal) { bestVal = v; bestKey = t.key; }
  }
  return ARCHETYPES[bestKey];
}

export function verdictFor(wins: number): string {
  if (wins >= 50) return 'UNDEFEATED. IMMORTAL.';
  if (wins >= 47) return 'ALL-TIME GREAT';
  if (wins >= 43) return 'HALL OF FAMER';
  if (wins >= 38) return 'CHAMPION';
  if (wins >= 32) return 'CONTENDER';
  if (wins >= 25) return 'GATEKEEPER';
  return 'JOURNEYMAN';
}

// ---------- fight card generation ----------

const FIRST = ['Marcus', 'Diego', 'Tyree', 'Kazuki', 'Ivan', 'Rafael', 'Dmitri', 'Jamal', 'Ricky', 'Bruno', 'Yusuf', 'Cole', 'Mateo', 'Andrei', 'Khalil', 'Tommy', 'Vince', 'Eddie', 'Jair', 'Dax', 'Roman', 'Silas', 'Moses', 'Arman', 'Kenji', 'Luther', 'Paulo', 'Gunnar', 'Ezra', 'Dario'];
const LAST = ['Vasquez', 'Okafor', 'Petrov', 'Tanaka', "O'Donnell", 'Crane', 'Maddox', 'Volkanov', 'Reyes', 'Stone', 'Carvalho', 'Drago', 'Hale', 'Iwasaki', 'Bishop', 'Kane', 'Moreau', 'Sokolov', 'Ferreira', 'Watts', 'Briggs', 'Calloway', 'Nakamura', 'Ortiz', 'Sterling'];
const NICKS = ['The Hyena', 'Iron', 'The Surgeon', 'Riptide', 'The Wolf', 'Sandman', 'The Problem', 'Bonecrusher', 'Night Train', 'The Scholar', 'Voodoo', 'Thunderbolt', 'The Reaper', 'Maestro', 'Diamond'];

const MILESTONES: Record<number, string> = {
  1: 'PRO DEBUT',
  10: 'UFC DEBUT',
  18: 'FIRST RANKED OPPONENT',
  25: 'MAIN EVENT',
  30: 'TITLE ELIMINATOR',
  33: 'TITLE FIGHT',
  38: 'UNIFICATION BOUT',
  42: 'SUPERFIGHT',
  46: 'CHAMP-CHAMP ATTEMPT',
  50: 'LEGACY FIGHT',
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fightTime(): string {
  const m = Math.floor(Math.random() * 5);
  const s = Math.floor(Math.random() * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const LOSS_BY_WEAKNESS: Record<TraitKey, string> = {
  chn: 'KO',
  str: 'TKO',
  pow: 'DEC',
  wre: 'SUB',
  gra: 'SUB',
  car: 'DEC (faded late)',
  iq:  'DEC (out-coached)',
};

export function simulateRun(slots: Slots): RunResult {
  const score = overallFrom(slots);
  const { overall, synergy, floor, domainFloor, eliteTraits, perfectEligible } = score;
  const wins = winsFrom(overall, perfectEligible);
  const losses = TOTAL_FIGHTS - wins;

  const traitOf = (k: TraitKey) => slots[k]?.value ?? 0;

  // losses land on the hardest fights (late-run title fights), with a little noise
  const difficulty = Array.from({ length: TOTAL_FIGHTS }, (_, i) => ({
    idx: i,
    d: i + (MILESTONES[i + 1] ? 6 : 0) + Math.random() * 7,
  }));
  const lossIdx = new Set(
    difficulty.sort((a, b) => b.d - a.d).slice(0, losses).map(x => x.idx)
  );

  // weakest trait decides how you lose
  let weakest: TraitKey = 'str';
  let weakestVal = 101;
  for (const t of TRAITS) {
    const v = traitOf(t.key);
    if (v < weakestVal) { weakestVal = v; weakest = t.key; }
  }

  // build determines how you win
  const koW = Math.pow(traitOf('pow') / 100, 2) * 1.15;
  const subW = Math.pow(traitOf('gra') / 100, 2) + Math.pow(traitOf('wre') / 100, 2) * 0.4;
  const decW = ((traitOf('car') + traitOf('iq')) / 200) * 0.95;
  const totalW = koW + subW + decW;

  const usedNames = new Set<string>();
  const fights: FightRow[] = [];
  for (let i = 0; i < TOTAL_FIGHTS; i++) {
    let name = `${pick(FIRST)} ${pick(LAST)}`;
    let guard = 0;
    while (usedNames.has(name) && guard++ < 20) name = `${pick(FIRST)} ${pick(LAST)}`;
    usedNames.add(name);
    if (Math.random() < 0.3) {
      const parts = name.split(' ');
      name = `${parts[0]} "${pick(NICKS)}" ${parts[1]}`;
    }

    const win = !lossIdx.has(i);
    let method: string;
    let round: number;
    if (win) {
      const r = Math.random() * totalW;
      if (r < koW) {
        method = pick(['KO', 'KO', 'TKO']);
        round = pick([1, 1, 2, 2, 3]);
      } else if (r < koW + subW) {
        method = pick(['SUB (RNC)', 'SUB (guillotine)', 'SUB (armbar)', 'SUB (D\'arce)', 'SUB (kimura)']);
        round = pick([1, 2, 2, 3, 4]);
      } else {
        method = pick(['DEC (unanimous)', 'DEC (unanimous)', 'DEC (split)']);
        round = 5;
      }
    } else {
      method = LOSS_BY_WEAKNESS[weakest];
      round = method.startsWith('DEC') ? 5 : pick([1, 2, 3, 4, 5]);
    }

    fights.push({
      n: i + 1,
      opponent: name,
      milestone: MILESTONES[i + 1] ?? null,
      win,
      method,
      round,
      time: method.startsWith('DEC') ? '5:00' : fightTime(),
    });
  }

  return {
    wins,
    losses,
    overall,
    synergy,
    floor,
    domainFloor,
    eliteTraits,
    perfectEligible,
    archetype: archetypeFor(slots, overall),
    verdict: verdictFor(wins),
    fights,
  };
}

export function shareText(result: RunResult, slots: Slots): string {
  const tier = (v: number) => (v >= 90 ? '🟩' : v >= 80 ? '🟨' : v >= 70 ? '🟧' : '🟥');
  const blocks = TRAITS.map(t => tier(slots[t.key]?.value ?? 0)).join('');
  const crown = result.wins === TOTAL_FIGHTS ? ' 👑' : '';
  return [
    `50-0 · MY FIGHTER WENT ${result.wins}-${result.losses}${crown}`,
    blocks,
    `LEGACY ${result.overall} · FLOOR ${result.floor} · ELITE ${result.eliteTraits}/7`,
    result.verdict,
    'Build yours → 50-0 the game',
  ].join('\n');
}
