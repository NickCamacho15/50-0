'use client';

import { useEffect, useRef, useState } from 'react';
import { CountUp, Confetti, sleep, useSound } from '@/components/shared';
import { POSITIONS, SOCCER_COMBOS, type Player, type PositionKey, type SoccerCombo } from '@/lib/soccer-data';
import {
  TOTAL_MATCHES,
  simulateSeason,
  shareText,
  type MatchRow,
  type SeasonResult,
  type SoccerSlots,
} from '@/lib/soccer-engine';
import { fetchSoccerLeaderboard, getSupabase, postSoccerRun, type SoccerLeaderboardRow } from '@/lib/supabase';

type Phase = 'idle' | 'spinning' | 'choose' | 'assign' | 'ready' | 'sim' | 'result';

const POSITION_CODES: Record<PositionKey, string> = Object.fromEntries(
  POSITIONS.map(p => [p.key, p.code])
) as Record<PositionKey, string>;

const CONFETTI_COLORS = ['#0d5c3c', '#c19a2b', '#b03328', '#16271d'];

const emptySlots = (): SoccerSlots => ({
  gk: null, cb: null, fb: null, cm: null, cam: null, wg: null, st: null,
});

// ============================================================

export default function SoccerGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [slots, setSlots] = useState<SoccerSlots>(emptySlots);
  const [combo, setCombo] = useState<SoccerCombo | null>(null);
  const [usedCombos, setUsedCombos] = useState<number[]>([]);
  const [usedPlayers, setUsedPlayers] = useState<string[]>([]);
  const [rerolls, setRerolls] = useState(1);
  const [assignPlayer, setAssignPlayer] = useState<Player | null>(null);
  const [reel, setReel] = useState({ div: '—', era: '—', tag: '', landed: false, spinning: false });
  const [flashKey, setFlashKey] = useState<PositionKey | null>(null);
  const [simRows, setSimRows] = useState<MatchRow[]>([]);
  const [result, setResult] = useState<SeasonResult | null>(null);
  const [pb, setPb] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState('');
  const [lb, setLb] = useState<SoccerLeaderboardRow[] | null>(null);
  const [lbName, setLbName] = useState('');
  const [lbPosted, setLbPosted] = useState(false);
  const [barsLive, setBarsLive] = useState(false);
  const skipRef = useRef(false);
  const sound = useSound('38-0:muted');

  const filledCount = POSITIONS.filter(p => slots[p.key]).length;
  const allFilled = filledCount === POSITIONS.length;
  const lbAvailable = typeof window !== 'undefined' && getSupabase() !== null;

  // a player only fits if one of their real positions is still open
  const fitsSomewhere = (p: Player) => p.positions.some(k => !slots[k]);
  // dead spin: nobody in the pool can fill any open position — re-spin is free
  const poolDead =
    phase === 'choose' && !!combo &&
    combo.players.every(p => usedPlayers.includes(p.name) || !fitsSomewhere(p));

  useEffect(() => { setPb(localStorage.getItem('38-0:pb')); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  // ---------- spin ----------
  const spin = async (isReroll = false) => {
    if (isReroll) {
      if (rerolls <= 0 || phase !== 'choose') return;
      setRerolls(r => r - 1);
    } else if (phase !== 'idle' && !poolDead) return;

    const remaining = SOCCER_COMBOS.map((_, i) => i).filter(i => !usedCombos.includes(i));
    if (remaining.length === 0) return;
    const chosenIdx = remaining[Math.floor(Math.random() * remaining.length)];
    const chosen = SOCCER_COMBOS[chosenIdx];
    setUsedCombos(u => [...u, chosenIdx]);
    setCombo(null);
    setPhase('spinning');
    setReel(r => ({ ...r, landed: false, spinning: true, tag: '' }));

    // decelerating reel — the anticipation is the product
    const steps = 16;
    for (let s = 0; s < steps; s++) {
      const rand = SOCCER_COMBOS[Math.floor(Math.random() * SOCCER_COMBOS.length)];
      setReel(r => ({ ...r, div: rand.division.toUpperCase(), era: rand.era }));
      sound.tick();
      await sleep(45 + s * s * 1.55);
    }
    setReel({ div: chosen.division.toUpperCase(), era: chosen.era, tag: chosen.tag, landed: true, spinning: false });
    sound.land();
    await sleep(220);
    setCombo(chosen);
    setPhase('choose');
  };

  // ---------- assign ----------
  const openAssign = (p: Player) => {
    if (usedPlayers.includes(p.name) || !fitsSomewhere(p)) return;
    setAssignPlayer(p);
    setPhase('assign');
  };

  const assign = (key: PositionKey) => {
    if (!assignPlayer || !combo || slots[key] || !assignPlayer.positions.includes(key)) return;
    const fill = {
      value: assignPlayer.ratings[key],
      donor: assignPlayer.name,
      donorNick: assignPlayer.nick,
      combo: `${combo.division} ${combo.era}`,
    };
    const next = { ...slots, [key]: fill };
    setSlots(next);
    setUsedPlayers(u => [...u, assignPlayer.name]);
    setAssignPlayer(null);
    setCombo(null);
    setFlashKey(key);
    sound.thud();
    setReel({ div: '—', era: '—', tag: '', landed: false, spinning: false });
    const done = POSITIONS.every(p => next[p.key]);
    setPhase(done ? 'ready' : 'idle');
  };

  // ---------- the season ----------
  const kickOff = async () => {
    if (!allFilled || phase !== 'ready') return;
    const res = simulateSeason(slots);
    setResult(res);
    setSimRows([]);
    setBarsLive(false);
    skipRef.current = false;
    setPhase('sim');

    for (let i = 0; i < res.matches.length; i++) {
      if (skipRef.current) {
        setSimRows(res.matches);
        break;
      }
      const row = res.matches[i];
      setSimRows(rows => [...rows, row]);
      if (row.win) sound.rowTickW(); else sound.rowTickL();
      await sleep(row.milestone ? 300 : row.win ? 90 : 460);
    }
    await sleep(700);

    // personal best
    const prev = Number((localStorage.getItem('38-0:pb') ?? '-1').split('-')[0]);
    if (res.wins > prev) {
      const rec = `${res.wins}-${res.losses}`;
      localStorage.setItem('38-0:pb', rec);
      setPb(rec);
    }

    setPhase('result');
    if (res.wins === TOTAL_MATCHES) sound.winBell(); else if (res.wins < 26) sound.womp(); else sound.land();
    requestAnimationFrame(() => setTimeout(() => setBarsLive(true), 60));
    setLbPosted(false);
    void fetchSoccerLeaderboard().then(setLb);
  };

  const runItBack = () => {
    setSlots(emptySlots());
    setCombo(null);
    setUsedCombos([]);
    setUsedPlayers([]);
    setRerolls(1);
    setAssignPlayer(null);
    setSimRows([]);
    setResult(null);
    setLbName('');
    setReel({ div: '—', era: '—', tag: '', landed: false, spinning: false });
    setPhase('idle');
  };

  const share = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(shareText(result, slots));
      showToast('Result copied to clipboard');
    } catch {
      showToast('Could not copy');
    }
  };

  const submitToLb = async () => {
    if (!result || lbPosted) return;
    const name = lbName.trim() || 'Anonymous XI';
    const ok = await postSoccerRun({
      squad_name: name,
      wins: result.wins,
      losses: result.losses,
      overall: result.overall,
      archetype: result.archetype.split('—')[0].trim(),
    });
    if (ok) {
      setLbPosted(true);
      showToast('Posted to the all-time table');
      void fetchSoccerLeaderboard().then(setLb);
    } else {
      showToast('Leaderboard unavailable');
    }
  };

  const valClass = (v: number) => (v >= 88 ? 'good' : v >= 75 ? 'mid' : 'bad');
  const hint =
    phase === 'idle'
      ? filledCount === 0
        ? 'Spin to draw a nation + decade. Sign ONE of their World Cup legends to one position.'
        : `${POSITIONS.length - filledCount} position${POSITIONS.length - filledCount === 1 ? '' : 's'} left. Spin again.`
      : phase === 'choose'
        ? poolDead
          ? 'Dead spin — nobody here plays your open positions. Spin again, on the house.'
          : 'Pick a player — ratings stay hidden until you lock in. Trust your football knowledge.'
        : phase === 'ready'
          ? 'Your XI is complete. Begin the road to the World Cup.'
          : ' ';

  return (
    <>
      <header className="sc-header">
        <div className="sc-brand">
          <span className="sc-brand-mark">38<i>–</i>0</span>
          <span className="sc-brand-tag">Conquer the World Cup</span>
        </div>
        <div className="sc-header-right">
          <div className="sc-pb" title="Your best record on this device"><b>{pb ?? '——'}</b></div>
          <button className="sc-iconbtn" onClick={sound.toggleMute} title="Toggle sound" aria-label="Toggle sound">
            {sound.muted ? '×' : '♪'}
          </button>
          <button className="sc-iconbtn" onClick={() => setShowHelp(true)} title="How it works">?</button>
        </div>
      </header>

      <main className="sc-main">
        {/* the draw */}
        <section className="sc-panel">
          <div className="sc-panel-head">
            <span className="sc-step">Step 01</span>
            <h2 className="sc-panel-title">The Draw</h2>
          </div>

          <div className="sc-reels">
            <div>
              <span className="sc-reel-cap">Nation</span>
              <div className={`sc-reel ${reel.spinning ? 'spinning' : ''} ${reel.landed ? 'landed' : ''}`}>
                <span className="sc-reel-text">{reel.div}</span>
              </div>
            </div>
            <div>
              <span className="sc-reel-cap">Era</span>
              <div className={`sc-reel sc-reel-era ${reel.spinning ? 'spinning' : ''} ${reel.landed ? 'landed' : ''}`}>
                <span className="sc-reel-text">{reel.era}</span>
              </div>
            </div>
          </div>
          <div className="sc-combo-tag">{reel.tag ? <span>{reel.tag}</span> : null}</div>

          <div className="sc-controls">
            <button className="sc-spin" onClick={() => void spin(false)} disabled={phase !== 'idle' && !poolDead}>
              Spin
            </button>
            <button
              className="sc-reroll"
              onClick={() => void spin(true)}
              disabled={phase !== 'choose' || rerolls === 0}
            >
              Re-roll <span className="sc-reroll-n">{rerolls}</span>
            </button>
          </div>
          <p className={`sc-hint ${hint.trim() ? '' : 'empty'}`}>{hint}</p>

          {!combo && filledCount === 0 && (
            <div className="sc-steps">
              {[
                ['1', 'Spin the wheel', 'A random nation and decade. The pool is their World Cup legends.'],
                ['2', 'Sign one player', 'One player per spin, only where they actually played. Ratings stay hidden until you lock in.'],
                ['3', 'Run the gauntlet', '38 matches from qualifying to the World Cup final. Only a flawless XI lifts the trophy.'],
              ].map(([n, h, d]) => (
                <div className="sc-howstep" key={n}>
                  <span className="sc-howstep-n">{n}</span>
                  <span className="sc-howstep-body">
                    <span className="sc-howstep-h">{h}</span>
                    <span className="sc-howstep-d">{d}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="sc-pool">
            {combo?.players.map((p, i) => {
              const used = usedPlayers.includes(p.name);
              const noFit = !used && !fitsSomewhere(p);
              return (
                <button key={p.name} className="sc-player" onClick={() => openAssign(p)} disabled={used || noFit}>
                  <span className="sc-player-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="sc-player-info">
                    <span className="sc-player-top">
                      <span className="sc-player-name">{p.name}</span>
                      <span className="sc-player-pos">{p.positions.map(k => POSITION_CODES[k]).join(' · ')}</span>
                      {p.nick ? <span className="sc-player-nick">“{p.nick}”</span> : null}
                    </span>
                    <span className="sc-player-blurb">{p.blurb}</span>
                  </span>
                  <span className="sc-player-cta">{used ? 'Signed' : noFit ? 'No fit' : 'Sign'}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* team sheet */}
        <section className="sc-panel">
          <div className="sc-panel-head">
            <span className="sc-step">Step 02</span>
            <h2 className="sc-panel-title">Team Sheet</h2>
            <span className="sc-panel-meta"><b>{filledCount}</b>/{POSITIONS.length}</span>
          </div>
          <div className="sc-sheet-sub">Sign seven legends, one per position. One re-roll, no second chances.</div>

          <div className="sc-slots">
            {POSITIONS.map(p => {
              const fill = slots[p.key];
              return (
                <div key={p.key} className={`sc-slot ${fill ? 'filled' : ''} ${flashKey === p.key ? 'flash' : ''}`}>
                  <span className="sc-slot-code">{POSITION_CODES[p.key]}</span>
                  <div className="sc-slot-body">
                    <div className="sc-slot-line">
                      <span className="sc-slot-label">{p.label}</span>
                      <span className="sc-slot-dots" />
                      {fill
                        ? <CountUp target={fill.value} className={`sc-slot-val ${valClass(fill.value)}`} />
                        : <span className="sc-slot-val">—</span>}
                    </div>
                    <div className="sc-slot-sub">
                      {fill ? <><b>{fill.donor}</b> · {fill.combo}</> : p.desc}
                    </div>
                    {fill && (
                      <div className="sc-slot-track">
                        <i style={{ width: `${fill.value}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className={`sc-kickoff ${phase === 'ready' ? 'armed' : ''}`}
            onClick={() => void kickOff()}
            disabled={phase !== 'ready'}
          >
            {phase === 'ready'
              ? 'Kick off — 38 matches'
              : `${POSITIONS.length - filledCount} position${POSITIONS.length - filledCount === 1 ? '' : 's'} to fill`}
          </button>
        </section>
      </main>

      {/* assign modal */}
      {phase === 'assign' && assignPlayer && (
        <div className="sc-overlay">
          <div className="sc-card">
            <div className="sc-assign-name">{assignPlayer.name}</div>
            <div className="sc-assign-q">Sign them where they actually played — the rating is revealed after you lock in.</div>
            <div className="sc-assign-opts">
              {POSITIONS.map(p => {
                const taken = slots[p.key];
                const eligible = assignPlayer.positions.includes(p.key);
                return (
                  <button key={p.key} className="sc-opt" onClick={() => assign(p.key)} disabled={!!taken || !eligible}>
                    <span className="sc-opt-code">{POSITION_CODES[p.key]}</span>
                    <span className="sc-opt-label">{p.label}</span>
                    {taken
                      ? <span className="sc-opt-note">filled by {taken.donor}</span>
                      : eligible
                        ? <span className="sc-opt-open">??</span>
                        : <span className="sc-opt-note">not their position</span>}
                  </button>
                );
              })}
            </div>
            <button className="sc-back" onClick={() => { setAssignPlayer(null); setPhase('choose'); }}>Back</button>
          </div>
        </div>
      )}

      {/* matchday feed */}
      {phase === 'sim' && (
        <div className="sc-overlay" onClick={() => { skipRef.current = true; }}>
          <div className="sc-sim">
            <div className="sc-sim-progress"><i style={{ width: `${(simRows.length / TOTAL_MATCHES) * 100}%` }} /></div>
            <div className="sc-sim-head">The road to the final — match <b>{simRows.length}</b> of {TOTAL_MATCHES}</div>
            <div className="sc-sim-feed">
              {simRows.slice(-12).map(r => (
                <div key={r.n} className={`sc-mrow ${r.win ? 'w' : 'l'} ${r.milestone ? 'milestone' : ''}`}>
                  <span className="sc-mrow-n">{r.n}</span>
                  <span className="sc-mrow-opp">
                    {r.milestone ? <small>{r.milestone} · </small> : null}
                    {r.opponent}
                  </span>
                  <span className="sc-mrow-res">{r.win ? `W ${r.score} · ${r.note}` : `L ${r.score} · ${r.note}`}</span>
                </div>
              ))}
            </div>
            <div className="sc-sim-skip">Tap anywhere to skip</div>
          </div>
        </div>
      )}

      {/* full-time */}
      {phase === 'result' && result && (
        <div className="sc-overlay">
          {result.wins === TOTAL_MATCHES && <Confetti colors={CONFETTI_COLORS} />}
          <div className="sc-result">
            <div className="sc-result-eyebrow">Full-time</div>
            <div className={`sc-result-record ${result.wins === TOTAL_MATCHES ? 'perfect' : ''}`}>
              {result.wins}–{result.losses}
            </div>
            <div className="sc-result-verdict">{result.verdict}</div>
            <div className="sc-result-arch">{result.archetype}{result.synergy ? <em> · ✦ no-weak-link bonus</em> : null}</div>
            <div className="sc-bars">
              {POSITIONS.map(p => {
                const fill = slots[p.key];
                const v = fill?.value ?? 0;
                const color = v >= 88 ? 'var(--green)' : v >= 75 ? 'var(--gold)' : 'var(--red)';
                return (
                  <div key={p.key} className="sc-bar">
                    <span className="sc-bar-code">{POSITION_CODES[p.key]}</span>
                    <span className="sc-bar-meta">
                      <span className="sc-bar-label">{p.label}</span>
                      <span className="sc-bar-donor">{fill ? fill.donor : '—'}</span>
                    </span>
                    <span className="sc-bar-track"><span className="sc-bar-fill" style={{ width: barsLive ? `${v}%` : 0, background: color }} /></span>
                    <span className="sc-bar-val" style={{ color }}>{v}</span>
                  </div>
                );
              })}
            </div>
            <div className="sc-result-ovr">
              Squad rating <b>{result.overall}</b> · needs 96+ to lift the trophy
            </div>
            <div className="sc-result-actions">
              <button className="sc-btn primary" onClick={() => void share()}>Share result</button>
              <button className="sc-btn ghost" onClick={runItBack}>Run it back</button>
            </div>
            <div className="sc-lb">
              {lbAvailable ? (
                <>
                  {!lbPosted && (
                    <div className="sc-lb-submit">
                      <input
                        value={lbName}
                        onChange={e => setLbName(e.target.value)}
                        maxLength={18}
                        placeholder="Name your nation"
                      />
                      <button className="sc-btn ghost small" onClick={() => void submitToLb()}>Post to leaderboard</button>
                    </div>
                  )}
                  <div className="sc-lb-title">All-time table</div>
                  <ol className="sc-lb-list">
                    {lb === null && <li className="sc-lb-empty">Loading…</li>}
                    {lb?.length === 0 && <li className="sc-lb-empty">Be the first on the all-time table.</li>}
                    {lb?.map((row, i) => (
                      <li key={`${row.squad_name}-${i}`}>
                        <span className="sc-lb-rank">{i + 1}</span>
                        <span className="sc-lb-who">{row.squad_name} <small>· {row.archetype}</small></span>
                        <span className="sc-lb-rec">{row.wins}–{row.losses}</span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <div className="sc-lb-title">Leaderboard coming online soon</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* help */}
      {showHelp && (
        <div className="sc-overlay" onClick={() => setShowHelp(false)}>
          <div className="sc-card sc-help" onClick={e => e.stopPropagation()}>
            <h2>How 38–0 works</h2>
            <p><strong>The Draw.</strong> Each round, the machine rolls a random <em>nation + decade</em> (e.g. “Brazil, 1958–1970”). You may only sign that country&apos;s World Cup legends from those tournaments. A combo never repeats in a run.</p>
            <p><strong>The Signing.</strong> Pick one player from the draw and sign them to exactly <em>one</em> of your seven slots — Goalkeeper, Centre-Back, Full-Back, Midfield, Playmaker, Winger or Striker. Players can only fill <em>positions they actually played</em> (no Mbappé in goal), and ratings stay hidden until you lock the pick — so the real question is how good a legend was at it, era against era.</p>
            <p><strong>One re-roll.</strong> Hate the draw? You get a single re-roll for the whole run. Spend it wisely. And if a draw gives you nobody who plays your open positions, the re-spin is free — a dead pool never costs you.</p>
            <p><strong>The Engine.</strong> Your Squad Rating is a weighted blend of all seven positions — Striker 18%, Midfield 16%, Centre-Back 15%, Playmaker 15%, Winger 14%, Goalkeeper 12%, Full-Back 10%. Ratings are <em>era-relative</em>: every legend is graded against their own era&apos;s peers. A balanced XI with no position below 75 earns a synergy bonus; one weak link drags the whole side down.</p>
            <p><strong>The Gauntlet.</strong> Wins are not linear. The engine maps your Squad Rating through a steep win-projection curve across 38 matches — qualifiers first, then a World Cup where every knockout opponent is an all-time giant (Brazil &apos;70, Argentina &apos;86, Spain &apos;10…). Losses always land on the hardest fixtures, so your record tells the story: 36–2 means you fell in the final. Only a flawless XI lifts the trophy. How you win follows your build; how you lose follows your weakest position.</p>
            <button className="sc-btn primary" onClick={() => setShowHelp(false)}>Got it</button>
          </div>
        </div>
      )}

      <footer className="sc-footer">
        Era-relative ratings — deterministic engine — zero mercy
        <a href="/">🥊 Also play: 50–0 — Build the Undefeated</a>
      </footer>

      <div className={`sc-toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  );
}
