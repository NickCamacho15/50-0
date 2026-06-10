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
    } else if (phase !== 'idle') return;

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
    if (usedPlayers.includes(p.name)) return;
    setAssignPlayer(p);
    setPhase('assign');
  };

  const assign = (key: PositionKey) => {
    if (!assignPlayer || !combo || slots[key]) return;
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

  const valClass = (v: number) => (v >= 88 ? 'v-good' : v >= 75 ? 'v-mid' : 'v-bad');
  const hint =
    phase === 'idle'
      ? filledCount === 0
        ? 'Spin to draw a nation + decade. Sign ONE of their World Cup legends to one position.'
        : `${POSITIONS.length - filledCount} position${POSITIONS.length - filledCount === 1 ? '' : 's'} left. Spin again.`
      : phase === 'choose'
        ? 'Pick a player — ratings stay hidden until you lock in. Trust your football knowledge.'
        : phase === 'ready'
          ? 'Your XI is complete. Begin the road to the World Cup.'
          : ' ';

  return (
    <div className="soccer-page">
      <header className="site-header">
        <div className="logo">
          <span className="logo-num">38<span className="logo-dash">–</span>0</span>
          <span className="logo-tag">CONQUER THE WORLD CUP</span>
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
                ['01', 'Spin the wheel', 'A random nation and decade. The pool is their World Cup legends.'],
                ['02', 'Sign one player', 'Seven positions, one player per spin. Ratings stay hidden until you lock in.'],
                ['03', 'Run the gauntlet', '38 matches from qualifying to the World Cup final. Only a flawless XI lifts the trophy.'],
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
            {combo?.players.map((p, i) => {
              const used = usedPlayers.includes(p.name);
              return (
                <button key={p.name} className={`pool-card ${used ? 'used' : ''}`} onClick={() => openAssign(p)} disabled={used}>
                  <span className="pool-ava">{String(i + 1).padStart(2, '0')}</span>
                  <span className="pool-info">
                    <span className="pool-name">{p.name}{p.nick ? <span className="pool-nick"> “{p.nick}”</span> : null}</span>
                    <span className="pool-blurb">{p.blurb}</span>
                  </span>
                  <span className="pool-cta">{used ? 'SIGNED' : 'SIGN →'}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* your XI */}
        <section className="panel fighter-panel">
          <div className="card-head">
            <span className="card-step">02</span>
            <h2 className="card-title">Your XI</h2>
            <span className="card-meta"><b>{filledCount}</b>/{POSITIONS.length} positions</span>
          </div>
          <div className="fighter-sub">Sign seven legends, one per position. One re-roll, no second chances.</div>
          <div className="slots">
            {POSITIONS.map(p => {
              const fill = slots[p.key];
              return (
                <div key={p.key} className={`slot ${fill ? 'filled' : ''} ${flashKey === p.key ? 'flash' : ''}`}>
                  <div className="slot-icon">{POSITION_CODES[p.key]}</div>
                  <div className="slot-mid">
                    <div className="slot-top">
                      <span className="slot-label">{p.label}</span>
                      {fill
                        ? <CountUp target={fill.value} className={`slot-val ${valClass(fill.value)}`} />
                        : <span className="slot-val">—</span>}
                    </div>
                    <div className="slot-donor">
                      {fill ? <>signed <b>{fill.donor}</b> · {fill.combo}</> : p.desc}
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
            onClick={() => void kickOff()}
            disabled={phase !== 'ready'}
          >
            {phase === 'ready'
              ? <>KICK OFF&nbsp;&nbsp;→&nbsp;&nbsp;38 MATCHES</>
              : `${POSITIONS.length - filledCount} POSITION${POSITIONS.length - filledCount === 1 ? '' : 'S'} TO FILL`}
          </button>
        </section>
      </main>

      {/* assign modal */}
      {phase === 'assign' && assignPlayer && (
        <div className="overlay">
          <div className="assign-card">
            <div className="assign-donor">{assignPlayer.name}</div>
            <div className="assign-q">Choose their position — the rating is revealed after you lock in. Out of position, even a legend is a liability.</div>
            <div className="assign-options">
              {POSITIONS.map(p => {
                const taken = slots[p.key];
                return (
                  <button key={p.key} className="assign-opt" onClick={() => assign(p.key)} disabled={!!taken}>
                    <span className="o-icon">{POSITION_CODES[p.key]}</span>
                    <span className="o-label">{p.label}</span>
                    {taken
                      ? <span className="o-taken">filled by {taken.donor}</span>
                      : <span className="o-hidden">??</span>}
                  </button>
                );
              })}
            </div>
            <button className="ghost-btn" onClick={() => { setAssignPlayer(null); setPhase('choose'); }}>Back</button>
          </div>
        </div>
      )}

      {/* sim feed */}
      {phase === 'sim' && (
        <div className="overlay" onClick={() => { skipRef.current = true; }}>
          <div className="sim-wrap">
            <div className="sim-progress"><i style={{ width: `${(simRows.length / TOTAL_MATCHES) * 100}%` }} /></div>
            <div className="sim-head">The road to the final — match <b>{simRows.length}</b> of {TOTAL_MATCHES}</div>
            <div className="sim-feed">
              {simRows.slice(-12).map(r => (
                <div key={r.n} className={`sim-row ${r.win ? 'w' : 'l'} ${r.milestone ? 'milestone' : ''}`}>
                  <span className="n">{r.n}</span>
                  <span className="opp">
                    {r.milestone ? <small>{r.milestone} · </small> : null}
                    {r.opponent}
                  </span>
                  <span className="res">{r.win ? `W ${r.score} · ${r.note}` : `L ${r.score} · ${r.note}`}</span>
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
          {result.wins === TOTAL_MATCHES && <Confetti />}
          <div className="result-card">
            <div className="result-eyebrow">Full-time</div>
            <div className={`result-record ${result.wins === TOTAL_MATCHES ? 'perfect' : ''}`}>
              {result.wins}–{result.losses}
            </div>
            <div className="result-verdict">{result.verdict}</div>
            <div className="result-archetype">{result.archetype}{result.synergy ? <em> · ✦ No-weak-link synergy bonus</em> : null}</div>
            <div className="result-bars">
              {POSITIONS.map(p => {
                const fill = slots[p.key];
                const v = fill?.value ?? 0;
                const color = v >= 88 ? 'var(--green)' : v >= 75 ? 'var(--gold)' : 'var(--red)';
                return (
                  <div key={p.key} className="rbar">
                    <span className="ri">{POSITION_CODES[p.key]}</span>
                    <span className="rmeta">
                      <span className="rl">{p.label}</span>
                      <span className="rdonor">{fill ? fill.donor : '—'}</span>
                    </span>
                    <span className="track"><span className="fill" style={{ width: barsLive ? `${v}%` : 0, background: color }} /></span>
                    <span className="rv" style={{ color }}>{v}</span>
                  </div>
                );
              })}
            </div>
            <div className="result-ovr">
              SQUAD RATING <b>{result.overall}</b> · needs 96+ to lift the trophy
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
                        placeholder="Name your nation"
                      />
                      <button className="ghost-btn small" onClick={() => void submitToLb()}>POST TO LEADERBOARD</button>
                    </div>
                  )}
                  <div className="lb-title">All-time table</div>
                  <ol className="lb-list">
                    {lb === null && <li className="lb-empty">Loading…</li>}
                    {lb?.length === 0 && <li className="lb-empty">Be the first on the all-time table.</li>}
                    {lb?.map((row, i) => (
                      <li key={`${row.squad_name}-${i}`}>
                        <span className="rank">{i + 1}</span>
                        <span className="who">{row.squad_name} <small>· {row.archetype}</small></span>
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
            <h2>HOW 38–0 WORKS</h2>
            <p><strong>The Spin.</strong> Each round, the machine rolls a random <em>nation + decade</em> (e.g. “Brazil, 1958–1970”). You may only sign that country&apos;s World Cup legends from those tournaments. A combo never repeats in a run.</p>
            <p><strong>The Signing.</strong> Pick one player from the spin and sign them to exactly <em>one</em> of your seven positions — Goalkeeper, Centre-Back, Full-Back, Midfield, Playmaker, Winger or Striker. Every legend is secretly rated at <em>all seven positions</em>, and ratings stay hidden until you lock the pick. Maldini at full-back is a 97. Maldini up front is a problem.</p>
            <p><strong>One re-roll.</strong> Hate the spin? You get a single re-roll for the whole run. Spend it wisely.</p>
            <p><strong>The Engine.</strong> Your Squad Rating is a weighted blend of all seven positions — Striker 18%, Midfield 16%, Centre-Back 15%, Playmaker 15%, Winger 14%, Goalkeeper 12%, Full-Back 10%. Ratings are <em>era-relative</em>: every legend is graded against their own era&apos;s peers. A balanced XI with no position below 75 earns a synergy bonus; one weak link drags the whole side down.</p>
            <p><strong>The Gauntlet.</strong> Wins are not linear. The engine maps your Squad Rating through a steep win-projection curve across 38 matches — qualifiers first, then a World Cup where every knockout opponent is an all-time giant (Brazil &apos;70, Argentina &apos;86, Spain &apos;10…). Losses always land on the hardest fixtures, so your record tells the story: 36–2 means you fell in the final. Only a flawless XI lifts the trophy. How you win follows your build; how you lose follows your weakest position.</p>
            <button className="primary-btn" onClick={() => setShowHelp(false)}>GOT IT</button>
          </div>
        </div>
      )}

      <footer className="site-footer">
        Era-relative ratings — deterministic engine — zero mercy
        <a className="footer-link" href="/">🥊 Also play: 50–0 — Build the Undefeated</a>
      </footer>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
