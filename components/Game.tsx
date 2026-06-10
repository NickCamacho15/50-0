'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { COMBOS, TRAITS, type Combo, type Fighter, type TraitKey } from '@/lib/data';
import {
  TOTAL_FIGHTS,
  simulateRun,
  shareText,
  type FightRow,
  type RunResult,
  type Slots,
} from '@/lib/engine';
import { fetchLeaderboard, getSupabase, postRun, type LeaderboardRow } from '@/lib/supabase';

type Phase = 'idle' | 'spinning' | 'choose' | 'assign' | 'ready' | 'sim' | 'result';

const TRAIT_CODES: Record<TraitKey, string> = {
  str: 'ST', pow: 'PW', wre: 'WR', gra: 'GR', car: 'CA', chn: 'DU', iq: 'IQ',
};

const emptySlots = (): Slots => ({
  str: null, pow: null, wre: null, gra: null, car: null, chn: null, iq: null,
});

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ---------- sound ----------
function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(localStorage.getItem('50-0:muted') === '1');
  }, []);

  const ctx = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    return ctxRef.current;
  };

  const tone = useCallback((freq: number, dur: number, type: OscillatorType = 'square', vol = 0.04, slideTo?: number) => {
    if (muted) return;
    try {
      const c = ctx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, c.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    } catch { /* audio unavailable */ }
  }, [muted]);

  return {
    muted,
    toggleMute: () => setMuted(m => { localStorage.setItem('50-0:muted', m ? '0' : '1'); return !m; }),
    tick: () => tone(1150, 0.035, 'square', 0.025),
    land: () => tone(440, 0.18, 'triangle', 0.06, 660),
    thud: () => tone(150, 0.14, 'sine', 0.09, 55),
    winBell: () => { tone(660, 0.5, 'triangle', 0.06); setTimeout(() => tone(880, 0.5, 'triangle', 0.06), 120); setTimeout(() => tone(1320, 0.8, 'triangle', 0.06), 260); },
    womp: () => tone(220, 0.5, 'sawtooth', 0.05, 80),
    rowTickW: () => tone(880, 0.025, 'square', 0.015),
    rowTickL: () => tone(220, 0.12, 'sawtooth', 0.04, 120),
  };
}

// ---------- count-up number ----------
function CountUp({ target, className }: { target: number; className: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const dur = 700;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <span className={className}>{val}</span>;
}

// ---------- confetti ----------
function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    const c = canvas.getContext('2d');
    if (!c) return;
    c.scale(dpr, dpr);
    const colors = ['#f4c95e', '#e7b43c', '#b98a24', '#eef1f7'];
    const parts = Array.from({ length: 160 }, () => ({
      x: Math.random() * innerWidth,
      y: -20 - Math.random() * innerHeight,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vy: 2 + Math.random() * 3.5,
      vx: -1 + Math.random() * 2,
      rot: Math.random() * Math.PI,
      vr: -0.1 + Math.random() * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    let raf = 0;
    let alive = true;
    const draw = () => {
      if (!alive) return;
      c.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.y += p.vy; p.x += p.vx; p.rot += p.vr;
        if (p.y > innerHeight + 30) { p.y = -20; p.x = Math.random() * innerWidth; }
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.fillStyle = p.color;
        c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        c.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);
  return <canvas id="confetti" ref={ref} />;
}

// ============================================================

export default function Game() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [slots, setSlots] = useState<Slots>(emptySlots);
  const [combo, setCombo] = useState<Combo | null>(null);
  const [usedCombos, setUsedCombos] = useState<number[]>([]);
  const [usedFighters, setUsedFighters] = useState<string[]>([]);
  const [rerolls, setRerolls] = useState(1);
  const [assignFighter, setAssignFighter] = useState<Fighter | null>(null);
  const [reel, setReel] = useState({ div: '—', era: '—', tag: '', landed: false, spinning: false });
  const [flashKey, setFlashKey] = useState<TraitKey | null>(null);
  const [simRows, setSimRows] = useState<FightRow[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [pb, setPb] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState('');
  const [lb, setLb] = useState<LeaderboardRow[] | null>(null);
  const [lbName, setLbName] = useState('');
  const [lbPosted, setLbPosted] = useState(false);
  const [barsLive, setBarsLive] = useState(false);
  const skipRef = useRef(false);
  const sound = useSound();

  const filledCount = TRAITS.filter(t => slots[t.key]).length;
  const allFilled = filledCount === TRAITS.length;
  const lbAvailable = typeof window !== 'undefined' && getSupabase() !== null;

  useEffect(() => { setPb(localStorage.getItem('50-0:pb')); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  // ---------- spin ----------
  const spin = async (isReroll = false) => {
    if (isReroll) {
      if (rerolls <= 0 || phase !== 'choose') return;
      setRerolls(r => r - 1);
    } else if (phase !== 'idle') return;

    const remaining = COMBOS.map((_, i) => i).filter(i => !usedCombos.includes(i));
    if (remaining.length === 0) return;
    const chosenIdx = remaining[Math.floor(Math.random() * remaining.length)];
    const chosen = COMBOS[chosenIdx];
    setUsedCombos(u => [...u, chosenIdx]);
    setCombo(null);
    setPhase('spinning');
    setReel(r => ({ ...r, landed: false, spinning: true, tag: '' }));

    // decelerating reel — the anticipation is the product
    const steps = 16;
    for (let s = 0; s < steps; s++) {
      const rand = COMBOS[Math.floor(Math.random() * COMBOS.length)];
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
  const openAssign = (f: Fighter) => {
    if (usedFighters.includes(f.name)) return;
    setAssignFighter(f);
    setPhase('assign');
  };

  const assign = (key: TraitKey) => {
    if (!assignFighter || !combo || slots[key]) return;
    const fill = {
      value: assignFighter.traits[key],
      donor: assignFighter.name,
      donorNick: assignFighter.nick,
      combo: `${combo.division} ${combo.era}`,
    };
    const next = { ...slots, [key]: fill };
    setSlots(next);
    setUsedFighters(u => [...u, assignFighter.name]);
    setAssignFighter(null);
    setCombo(null);
    setFlashKey(key);
    sound.thud();
    setReel({ div: '—', era: '—', tag: '', landed: false, spinning: false });
    const done = TRAITS.every(t => next[t.key]);
    setPhase(done ? 'ready' : 'idle');
  };

  // ---------- the run ----------
  const fight = async () => {
    if (!allFilled || phase !== 'ready') return;
    const res = simulateRun(slots);
    setResult(res);
    setSimRows([]);
    setBarsLive(false);
    skipRef.current = false;
    setPhase('sim');

    for (let i = 0; i < res.fights.length; i++) {
      if (skipRef.current) {
        setSimRows(res.fights);
        break;
      }
      const row = res.fights[i];
      setSimRows(rows => [...rows, row]);
      if (row.win) sound.rowTickW(); else sound.rowTickL();
      await sleep(row.milestone ? 300 : row.win ? 80 : 460);
    }
    await sleep(700);

    // personal best
    const prev = Number((localStorage.getItem('50-0:pb') ?? '-1').split('-')[0]);
    if (res.wins > prev) {
      const rec = `${res.wins}-${res.losses}`;
      localStorage.setItem('50-0:pb', rec);
      setPb(rec);
    }

    setPhase('result');
    if (res.wins === TOTAL_FIGHTS) sound.winBell(); else if (res.wins < 35) sound.womp(); else sound.land();
    requestAnimationFrame(() => setTimeout(() => setBarsLive(true), 60));
    setLbPosted(false);
    void fetchLeaderboard().then(setLb);
  };

  const runItBack = () => {
    setSlots(emptySlots());
    setCombo(null);
    setUsedCombos([]);
    setUsedFighters([]);
    setRerolls(1);
    setAssignFighter(null);
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
    const name = lbName.trim() || 'Anonymous Savage';
    const ok = await postRun({
      fighter_name: name,
      wins: result.wins,
      losses: result.losses,
      overall: result.overall,
      archetype: result.archetype.split('—')[0].trim(),
    });
    if (ok) {
      setLbPosted(true);
      showToast('Posted to the all-time list');
      void fetchLeaderboard().then(setLb);
    } else {
      showToast('Leaderboard unavailable');
    }
  };

  const valClass = (v: number) => (v >= 88 ? 'v-good' : v >= 75 ? 'v-mid' : 'v-bad');
  const hint =
    phase === 'idle'
      ? filledCount === 0
        ? 'Spin to draw a random division + era. Steal ONE trait from one fighter.'
        : `${TRAITS.length - filledCount} trait${TRAITS.length - filledCount === 1 ? '' : 's'} left. Spin again.`
      : phase === 'choose'
        ? 'Pick a fighter — ratings stay hidden until you lock in. Trust your fight knowledge.'
        : phase === 'ready'
          ? 'Your fighter is complete. Begin the run.'
          : ' ';

  return (
    <>
      <header className="site-header">
        <div className="logo">
          <span className="logo-num">50<span className="logo-dash">–</span>0</span>
          <span className="logo-tag">BUILD THE UNDEFEATED</span>
        </div>
        <div className="header-right">
          <div className="pb-chip" title="Your best record on this device">{pb ?? '——'}</div>
          <button className="icon-btn" onClick={sound.toggleMute} title="Toggle sound" aria-label="Toggle sound">
            {sound.muted ? '×' : '♪'}
          </button>
          <button className="icon-btn" onClick={() => setShowHelp(true)} title="How it works">?</button>
        </div>
      </header>

      <main className="layout">
        {/* slot machine + pool */}
        <section className="panel machine-panel">
          <div className="card-head">
            <span className="card-step">01</span>
            <h2 className="card-title">The Spin</h2>
          </div>
          <div className="machine">
            <div className="reels">
              <div className={`reel ${reel.spinning ? 'spinning' : ''} ${reel.landed ? 'landed' : ''}`}>
                <span className="reel-text">{reel.div}</span>
              </div>
              <div className={`reel reel-era ${reel.spinning ? 'spinning' : ''} ${reel.landed ? 'landed' : ''}`}>
                <span className="reel-text">{reel.era}</span>
              </div>
            </div>
            <div className="combo-tag">{reel.tag ? <span>{reel.tag}</span> : null}</div>
            <div className="machine-controls">
              <button className="spin-btn" onClick={() => void spin(false)} disabled={phase !== 'idle'}>
                SPIN
              </button>
              <button
                className="reroll-btn"
                onClick={() => void spin(true)}
                disabled={phase !== 'choose' || rerolls === 0}
              >
                RE-ROLL <span className="reroll-count">{rerolls}</span>
              </button>
            </div>
            <p className={`machine-hint ${hint.trim() ? '' : 'empty'}`}>{hint}</p>
          </div>

          {!combo && filledCount === 0 && (
            <div className="steps">
              {[
                ['01', 'Spin the wheel', 'A random division and era. The pool is whoever was there.'],
                ['02', 'Steal one trait', 'Seven slots, one trait per fighter. Ratings stay hidden until you lock in.'],
                ['03', 'Run the table', 'Fifty fights against a deterministic engine. Only a flawless build goes 50–0.'],
              ].map(([n, h, d]) => (
                <div className="step" key={n}>
                  <span className="step-n">{n}</span>
                  <span className="step-body">
                    <span className="step-h">{h}</span>
                    <span className="step-d">{d}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="pool">
            {combo?.fighters.map((f, i) => {
              const used = usedFighters.includes(f.name);
              return (
                <button key={f.name} className={`pool-card ${used ? 'used' : ''}`} onClick={() => openAssign(f)} disabled={used}>
                  <span className="pool-ava">{String(i + 1).padStart(2, '0')}</span>
                  <span className="pool-info">
                    <span className="pool-name">{f.name}{f.nick ? <span className="pool-nick"> “{f.nick}”</span> : null}</span>
                    <span className="pool-blurb">{f.blurb}</span>
                  </span>
                  <span className="pool-cta">{used ? 'TAKEN' : 'STEAL →'}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* your fighter */}
        <section className="panel fighter-panel">
          <div className="card-head">
            <span className="card-step">02</span>
            <h2 className="card-title">Your Fighter</h2>
            <span className="card-meta"><b>{filledCount}</b>/{TRAITS.length} traits</span>
          </div>
          <div className="fighter-sub">Steal seven traits, one per fighter. One re-roll, no second chances.</div>
          <div className="slots">
            {TRAITS.map(t => {
              const fill = slots[t.key];
              return (
                <div key={t.key} className={`slot ${fill ? 'filled' : ''} ${flashKey === t.key ? 'flash' : ''}`}>
                  <div className="slot-icon">{TRAIT_CODES[t.key]}</div>
                  <div className="slot-mid">
                    <div className="slot-top">
                      <span className="slot-label">{t.label}</span>
                      {fill
                        ? <CountUp target={fill.value} className={`slot-val ${valClass(fill.value)}`} />
                        : <span className="slot-val">—</span>}
                    </div>
                    <div className="slot-donor">
                      {fill ? <>from <b>{fill.donor}</b> · {fill.combo}</> : t.desc}
                    </div>
                    {fill && (
                      <div className="slot-track">
                        <i className={fill.value >= 88 ? 't-good' : ''} style={{ width: `${fill.value}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className={`fight-btn ${phase === 'ready' ? 'armed' : ''}`}
            onClick={() => void fight()}
            disabled={phase !== 'ready'}
          >
            {phase === 'ready'
              ? <>BEGIN THE RUN&nbsp;&nbsp;→&nbsp;&nbsp;50 FIGHTS</>
              : `${TRAITS.length - filledCount} TRAIT${TRAITS.length - filledCount === 1 ? '' : 'S'} TO UNLOCK`}
          </button>
        </section>
      </main>

      {/* assign modal */}
      {phase === 'assign' && assignFighter && (
        <div className="overlay">
          <div className="assign-card">
            <div className="assign-donor">{assignFighter.name}</div>
            <div className="assign-q">Steal one trait — the rating is revealed after you lock in.</div>
            <div className="assign-options">
              {TRAITS.map(t => {
                const taken = slots[t.key];
                return (
                  <button key={t.key} className="assign-opt" onClick={() => assign(t.key)} disabled={!!taken}>
                    <span className="o-icon">{TRAIT_CODES[t.key]}</span>
                    <span className="o-label">{t.label}</span>
                    {taken
                      ? <span className="o-taken">filled by {taken.donor}</span>
                      : <span className="o-hidden">??</span>}
                  </button>
                );
              })}
            </div>
            <button className="ghost-btn" onClick={() => { setAssignFighter(null); setPhase('choose'); }}>Back</button>
          </div>
        </div>
      )}

      {/* sim feed */}
      {phase === 'sim' && (
        <div className="overlay" onClick={() => { skipRef.current = true; }}>
          <div className="sim-wrap">
            <div className="sim-progress"><i style={{ width: `${(simRows.length / TOTAL_FIGHTS) * 100}%` }} /></div>
            <div className="sim-head">Simulating the run — fight <b>{simRows.length}</b> of {TOTAL_FIGHTS}</div>
            <div className="sim-feed">
              {simRows.slice(-12).map(r => (
                <div key={r.n} className={`sim-row ${r.win ? 'w' : 'l'} ${r.milestone ? 'milestone' : ''}`}>
                  <span className="n">{r.n}</span>
                  <span className="opp">
                    {r.milestone ? <small>{r.milestone} · </small> : null}
                    vs. {r.opponent}
                  </span>
                  <span className="res">{r.win ? `W · ${r.method} · R${r.round} ${r.time}` : `L · ${r.method}`}</span>
                </div>
              ))}
            </div>
            <div className="sim-skip">Tap anywhere to skip</div>
          </div>
        </div>
      )}

      {/* result */}
      {phase === 'result' && result && (
        <div className="overlay">
          {result.wins === TOTAL_FIGHTS && <Confetti />}
          <div className="result-card">
            <div className="result-eyebrow">Official result</div>
            <div className={`result-record ${result.wins === TOTAL_FIGHTS ? 'perfect' : ''}`}>
              {result.wins}–{result.losses}
            </div>
            <div className="result-verdict">{result.verdict}</div>
            <div className="result-archetype">{result.archetype}{result.synergy ? <em> · ✦ No-holes synergy bonus</em> : null}</div>
            <div className="result-bars">
              {TRAITS.map(t => {
                const fill = slots[t.key];
                const v = fill?.value ?? 0;
                const color = v >= 88 ? 'var(--green)' : v >= 75 ? 'var(--gold)' : 'var(--red)';
                return (
                  <div key={t.key} className="rbar">
                    <span className="ri">{TRAIT_CODES[t.key]}</span>
                    <span className="rmeta">
                      <span className="rl">{t.label}</span>
                      <span className="rdonor">{fill ? fill.donor : '—'}</span>
                    </span>
                    <span className="track"><span className="fill" style={{ width: barsLive ? `${v}%` : 0, background: color }} /></span>
                    <span className="rv" style={{ color }}>{v}</span>
                  </div>
                );
              })}
            </div>
            <div className="result-ovr">
              STRENGTH RATING <b>{result.overall}</b> · needs 96+ to run the table
            </div>
            <div className="result-actions">
              <button className="primary-btn" onClick={() => void share()}>SHARE RESULT</button>
              <button className="ghost-btn" onClick={runItBack}>RUN IT BACK</button>
            </div>
            <div className="lb-section">
              {lbAvailable ? (
                <>
                  {!lbPosted && (
                    <div className="lb-submit">
                      <input
                        value={lbName}
                        onChange={e => setLbName(e.target.value)}
                        maxLength={18}
                        placeholder="Name your fighter"
                      />
                      <button className="ghost-btn small" onClick={() => void submitToLb()}>POST TO LEADERBOARD</button>
                    </div>
                  )}
                  <div className="lb-title">All-time leaderboard</div>
                  <ol className="lb-list">
                    {lb === null && <li className="lb-empty">Loading…</li>}
                    {lb?.length === 0 && <li className="lb-empty">Be the first on the all-time list.</li>}
                    {lb?.map((row, i) => (
                      <li key={`${row.fighter_name}-${i}`}>
                        <span className="rank">{i + 1}</span>
                        <span className="who">{row.fighter_name} <small>· {row.archetype}</small></span>
                        <span className="rec">{row.wins}–{row.losses}</span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <div className="lb-title">Leaderboard coming online soon</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* help */}
      {showHelp && (
        <div className="overlay" onClick={() => setShowHelp(false)}>
          <div className="help-card" onClick={e => e.stopPropagation()}>
            <h2>HOW 50–0 WORKS</h2>
            <p><strong>The Spin.</strong> Each round, the machine rolls a random <em>division + era</em> (e.g. “Lightweight, 2016–2021”). You may only draft from fighters who competed in that division during that window. A combo never repeats in a run.</p>
            <p><strong>The Steal.</strong> Pick one fighter from the spin and steal exactly <em>one</em> of their seven traits — Striking, KO Power, Wrestling, Grappling, Cardio, Durability or Fight IQ. Ratings are hidden until you lock the pick: infer them from the résumé, the era, and your fight knowledge.</p>
            <p><strong>One re-roll.</strong> Hate the spin? You get a single re-roll for the whole run. Spend it wisely.</p>
            <p><strong>The Engine.</strong> Your fighter&apos;s Strength Rating is a weighted blend of all seven traits — Striking 20%, Wrestling 18%, KO Power 15%, Grappling 15%, Cardio 12%, Durability 10%, Fight IQ 10%. Ratings are <em>era-relative</em>: every legend is graded against their own era&apos;s peers. A balanced fighter with no trait below 75 earns a synergy bonus; one weak trait drags the whole rating down.</p>
            <p><strong>The Curve.</strong> Wins are not linear. The engine maps your Strength Rating through a steep win-projection curve across 50 simulated fights — only a near-flawless build runs the table. Method of victory follows your build: power punchers knock people out, grapplers strangle them, marathoners win on the cards. How you lose follows your weakest trait.</p>
            <button className="primary-btn" onClick={() => setShowHelp(false)}>GOT IT</button>
          </div>
        </div>
      )}

      <footer className="site-footer">
        Era-relative ratings — deterministic engine — zero mercy
      </footer>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  );
}
