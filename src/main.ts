/**
 * Thin DOM client for the Plot lobby starter.
 *
 * The client is pure presentation: it reads the authoritative snapshot from
 * `room.currentState` and sends intents on the `event` channel. State is polled
 * a few times a second (and on every room event) and the DOM is rebuilt only
 * when a structural signature changes; the countdown is refreshed in place.
 *
 * All user-supplied text is written via `textContent` (never innerHTML).
 */
import './lobby.css';
import { Plot, type Room } from '@plot/client';
import {
  MAX_GUESS,
  MIN_GUESS,
  TICKS_PER_SECOND,
  type State,
  clampGuess,
  closestPlayer,
  ranking,
} from './logic';

/** Per-tab config. App key + API URL come from Vite env; see README. */
const appKey = import.meta.env.VITE_PLOT_APP_KEY ?? 'demo';
const apiUrl = import.meta.env.VITE_PLOT_API_URL ?? undefined;
/** Room to join. Shareable via ?room=CODE; defaults to a fixed demo room. */
const roomCode = (new URLSearchParams(location.search).get('room') ?? 'LOBBY1')
  .toUpperCase()
  .slice(0, 12);
/** A stable id per browser tab. */
const me = `p_${Math.random().toString(36).slice(2, 9)}`;

const host = document.getElementById('app');
if (!host) throw new Error('#app mount point missing');

// ---- Persistent regions ----------------------------------------------

const root = document.createElement('div');
root.className = 'lobby';
const header = document.createElement('div');
header.className = 'lobby-header';
const title = document.createElement('div');
title.className = 'lobby-title';
title.textContent = 'Plot lobby starter';
const sub = document.createElement('div');
sub.className = 'lobby-sub';
sub.textContent = 'connecting…';
header.append(title, sub);
const stage = document.createElement('div');
root.append(header, stage);
host.appendChild(root);

// Local UI drafts preserved across re-renders.
let nameDraft = '';
let guessDraft = '';
let sentName = false;

let room: Room | null = null;
let lastSig = '';
let timerEl: HTMLElement | null = null;

const send = (msg: unknown): void => {
  room?.send(msg, { channel: 'event' });
};

// ---- Small builders ---------------------------------------------------

const secondsLeft = (s: State): number => {
  if (s.deadlineTick === undefined) return 0;
  return Math.max(0, Math.ceil((s.deadlineTick - s.tick) / TICKS_PER_SECOND));
};

/** Host = first present player by stable id order (mirrors firstPlayer for UI). */
const isHost = (s: State): boolean => {
  const present = Object.keys(s.players)
    .filter((id) => s.players[id]?.present)
    .sort();
  return present[0] === me;
};

const card = (): HTMLElement => {
  const c = document.createElement('div');
  c.className = 'card';
  return c;
};

const button = (label: string, cls = ''): HTMLButtonElement => {
  const b = document.createElement('button');
  b.className = `btn ${cls}`.trim();
  b.textContent = label;
  return b;
};

function playerList(s: State): HTMLElement {
  const list = document.createElement('div');
  list.className = 'list';
  const hostId = Object.keys(s.players)
    .filter((id) => s.players[id]?.present)
    .sort()[0];
  for (const { id, name, score, present } of ranking(s.players)) {
    const row = document.createElement('div');
    row.className = 'player';
    if (id === me) row.classList.add('me');
    if (!present) row.classList.add('absent');
    const left = document.createElement('div');
    const dot = document.createElement('span');
    dot.className = 'dot';
    const nameEl = document.createElement('span');
    nameEl.textContent = name + (id === me ? ' (you)' : '');
    left.append(dot, nameEl);
    if (id === hostId) {
      const tag = document.createElement('span');
      tag.className = 'host-tag';
      tag.textContent = 'HOST';
      left.append(tag);
    }
    const sc = document.createElement('span');
    sc.className = 'score';
    sc.textContent = String(score);
    row.append(left, sc);
    list.append(row);
  }
  return list;
}

function addTimer(c: HTMLElement, s: State): void {
  const t = document.createElement('div');
  t.className = 'timer';
  t.textContent = `${secondsLeft(s)}s`;
  timerEl = t;
  c.append(t);
}

// ---- Phase views ------------------------------------------------------

function renderLobby(s: State): HTMLElement {
  const c = card();

  const code = document.createElement('div');
  code.className = 'code';
  code.textContent = roomCode;
  code.title = 'Click to copy';
  code.addEventListener('click', () => void navigator.clipboard?.writeText(roomCode));
  const hint = document.createElement('div');
  hint.className = 'code-hint';
  hint.textContent = 'Share this code — anyone who joins it lands here.';
  c.append(code, hint);

  const row = document.createElement('div');
  row.className = 'row';
  const input = document.createElement('input');
  input.className = 'input';
  input.placeholder = 'Your nickname';
  input.value = nameDraft;
  input.maxLength = 24;
  input.addEventListener('input', () => {
    nameDraft = input.value;
  });
  const setBtn = button(sentName ? 'Update name' : 'Set name', 'ghost');
  setBtn.addEventListener('click', () => {
    const name = nameDraft.trim();
    if (name.length === 0) return;
    send({ kind: 'setName', name });
    sentName = true;
    scheduleRender(true);
  });
  row.append(input, setBtn);
  c.append(row);

  c.append(playerList(s));

  if (isHost(s)) {
    const start = button('Start match');
    start.addEventListener('click', () => send({ kind: 'start' }));
    c.append(start);
  } else {
    const waiting = document.createElement('div');
    waiting.className = 'muted';
    waiting.textContent = 'Waiting for the host to start…';
    c.append(waiting);
  }
  return c;
}

function renderRound(s: State): HTMLElement {
  const c = card();
  const prompt = document.createElement('div');
  prompt.className = 'prompt';
  prompt.textContent = `Round ${s.round + 1} of ${s.maxRounds} — guess ${MIN_GUESS}–${MAX_GUESS}`;
  c.append(prompt);
  addTimer(c, s);

  const guesses = s.guesses ?? {};
  const myGuess = guesses[me];

  if (myGuess !== undefined) {
    const done = document.createElement('div');
    done.className = 'muted';
    done.textContent = `Locked in: ${myGuess}. You can change it until time runs out.`;
    c.append(done);
  }

  const row = document.createElement('div');
  row.className = 'row';
  const input = document.createElement('input');
  input.className = 'input';
  input.type = 'number';
  input.min = String(MIN_GUESS);
  input.max = String(MAX_GUESS);
  input.placeholder = `${MIN_GUESS}–${MAX_GUESS}`;
  input.value = guessDraft;
  input.addEventListener('input', () => {
    guessDraft = input.value;
  });
  const submit = button(myGuess === undefined ? 'Submit guess' : 'Change guess');
  const submitGuess = (): void => {
    const n = Number(guessDraft);
    if (!Number.isFinite(n) || guessDraft.trim() === '') return;
    send({ kind: 'guess', value: clampGuess(n) });
    scheduleRender(true);
  };
  submit.addEventListener('click', submitGuess);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitGuess();
  });
  row.append(input, submit);
  c.append(row);

  const submitted = document.createElement('div');
  submitted.className = 'muted';
  const names = Object.keys(guesses)
    .map((id) => s.players[id]?.name ?? 'Player')
    .sort();
  submitted.textContent =
    names.length === 0 ? 'No guesses yet.' : `Guessed: ${names.join(', ')}`;
  c.append(submitted);
  return c;
}

function renderIntermission(s: State): HTMLElement {
  const c = card();
  const winner = closestPlayer(s.target ?? 0, s.guesses);
  const reveal = document.createElement('div');
  reveal.className = 'reveal';
  const target = document.createElement('strong');
  target.textContent = String(s.target ?? '?');
  reveal.append('Target was ', target, '. ');
  if (winner) {
    const wname = document.createElement('strong');
    wname.textContent = s.players[winner]?.name ?? 'Player';
    const wguess = s.guesses?.[winner];
    reveal.append('Closest: ', wname, wguess !== undefined ? ` (${wguess})` : '');
  } else {
    reveal.append('Nobody guessed.');
  }
  c.append(reveal);
  addTimer(c, s);
  c.append(scoreboard(s));
  return c;
}

function renderOver(s: State): HTMLElement {
  const c = card();
  const board = ranking(s.players);
  const banner = document.createElement('div');
  banner.className = 'banner';
  banner.textContent = board[0] ? `🏆 ${board[0].name} wins!` : 'Game over';
  c.append(banner);
  c.append(scoreboard(s, true));
  return c;
}

function scoreboard(s: State, over = false): HTMLElement {
  const list = document.createElement('div');
  list.className = 'board';
  ranking(s.players).forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'board-row';
    if (over && i === 0) row.classList.add('winner');
    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = `#${i + 1}`;
    const name = document.createElement('span');
    name.textContent = p.name + (p.id === me ? ' (you)' : '');
    const sc = document.createElement('span');
    sc.className = 'score';
    sc.textContent = String(p.score);
    row.append(rank, name, sc);
    list.append(row);
  });
  return list;
}

function renderConnecting(): HTMLElement {
  const c = card();
  const m = document.createElement('div');
  m.className = 'muted';
  m.textContent = 'Joining room…';
  c.append(m);
  return c;
}

// ---- Render loop ------------------------------------------------------

function build(s: State | undefined): { sig: string; el: HTMLElement } {
  if (!s) return { sig: 'connecting', el: renderConnecting() };
  switch (s.phase) {
    case 'lobby':
      return {
        sig: `lobby|${Object.keys(s.players).length}|${isHost(s)}|${sentName}`,
        el: renderLobby(s),
      };
    case 'round':
      return {
        sig: `round|${s.round}|${Object.keys(s.guesses ?? {}).length}|${(s.guesses ?? {})[me] ?? ''}`,
        el: renderRound(s),
      };
    case 'intermission':
      return { sig: `inter|${s.round}`, el: renderIntermission(s) };
    case 'over':
      return { sig: 'over', el: renderOver(s) };
    default:
      return { sig: 'connecting', el: renderConnecting() };
  }
}

function phaseLabel(s: State): string {
  switch (s.phase) {
    case 'lobby':
      return `Lobby · ${Object.values(s.players).filter((p) => p.present).length} here`;
    case 'round':
      return `Round ${s.round + 1}/${s.maxRounds}`;
    case 'intermission':
      return 'Scores';
    case 'over':
      return 'Game over';
    default:
      return '';
  }
}

let pending = false;
function scheduleRender(force = false): void {
  if (force) lastSig = '';
  if (pending) return;
  pending = true;
  queueMicrotask(() => {
    pending = false;
    doRender();
  });
}

function doRender(): void {
  const s = room?.currentState as State | undefined;
  const { sig, el } = build(s);
  sub.textContent = s ? phaseLabel(s) : 'connecting…';
  if (sig !== lastSig) {
    lastSig = sig;
    timerEl = null;
    stage.replaceChildren(el);
    const keep = stage.querySelector<HTMLInputElement>('input[type="number"]');
    keep?.focus();
  } else if (timerEl && s) {
    timerEl.textContent = `${secondsLeft(s)}s`;
  }
}

// Poll the snapshot a few times a second; events trigger an immediate pass.
window.setInterval(doRender, 200);

// ---- Connect ----------------------------------------------------------

void (async () => {
  const plot = new Plot({ appKey, playerId: me, apiUrl });
  room = await plot.join({ mode: 'code', roomCode });
  room.on('join', () => scheduleRender());
  room.on('leave', () => scheduleRender());
  room.on('message', () => scheduleRender());
  scheduleRender(true);
})().catch((err) => {
  sub.textContent = 'Failed to join room';
  console.error('[lobby] join failed', err);
});
