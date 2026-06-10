# 50–0 — Build the Undefeated 🥊

A wheel-spin draft game for fight fans, inspired by the viral **82-0** (NBA) and **20-0** (NFL) sites — but instead of drafting a team, you Frankenstein **one perfect fighter** from the traits of MMA legends.

**Play:** spin the slot machine → it lands on a random *division + era* (e.g. “Lightweight · 2016–2021, The Khabib Era”) → steal exactly **one** of seven traits from one fighter in that pool → repeat until all seven slots are filled. One re-roll per run. Then the engine simulates 50 fights.

## The seven traits

| Trait | Weight |
|---|---|
| 🥊 Striking | 20% |
| 🤼 Wrestling | 18% |
| 💥 KO Power | 15% |
| 🐍 Grappling | 15% |
| 🫀 Cardio | 12% |
| 🗿 Durability | 10% |
| 🧠 Fight IQ | 10% |

## The engine

Same architecture the viral games use — **deterministic, no RNG in the record**:

```
strength = Σ (trait × weight) + synergy bonus (no trait below 75)
wins     = round(50 × min(strength / 96, 1) ^ 2.2)
```

Ratings are **era-relative** (every legend graded against their own era's peers) and **hidden until you lock a pick** — you draft on fight knowledge, not numbers. The steep curve means only a near-flawless build runs the table. Method of victory follows your build (power → KOs, grappling → subs, cardio/IQ → decisions); how you lose follows your weakest trait.

## Stack

- **Next.js 15 + TypeScript** (App Router, fully static page)
- **Supabase** — global leaderboard (`runs` table, RLS: anon insert/select)
- **Vercel** — hosting

## Develop

```bash
npm install
npm run dev
```

Optional leaderboard — create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Database schema lives in `supabase/migrations/` (`supabase db push` to apply).

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
