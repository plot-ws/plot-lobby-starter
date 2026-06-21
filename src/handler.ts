/**
 * Authoritative room handler for the Plot lobby starter.
 *
 * Runs at tickRate 5. The handler owns the truth: clients send intents on the
 * `event` channel, the handler mutates `ctx.state`, and Plot snapshots the
 * state each tick to every client (read via `room.currentState`).
 *
 * All phase/timing decisions are delegated to the pure reducers in `logic.ts`,
 * so the rules are testable and identical wherever they run. Timing is purely
 * tick-based (no wall-clock) for deterministic reliability.
 */
import { defineRoom } from '@plot/handler';
import type { HandlerContext } from '@plot/handler';
import {
  MAX_ROUNDS,
  type State,
  advance,
  clampGuess,
  deadlineReached,
  startMatch,
} from './logic';

/** Client → server messages on the `event` channel. */
export type Msg =
  | { kind: 'setName'; name: string }
  | { kind: 'start' }
  | { kind: 'guess'; value: number };

const initialState: State = {
  phase: 'lobby',
  tick: 0,
  round: 0,
  maxRounds: MAX_ROUNDS,
  players: {},
};

/** Whether a player id is the room host (first player still present). */
function isHost(id: string, ctx: HandlerContext<State>): boolean {
  return ctx.firstPlayer?.id === id;
}

/** Submit every player's final score to the shared 'lobby' leaderboard. */
function publishScores(ctx: HandlerContext<State>): void {
  const board = ctx.leaderboard('lobby');
  for (const [id, rec] of Object.entries(ctx.state.players)) {
    // Fire-and-forget; a failed submit must not crash the room.
    void board.submit(id, rec.score).catch((e) => ctx.warn('leaderboard submit failed', e));
  }
}

export default defineRoom<State, Msg>({
  initialState,
  channels: {
    state: { reliable: true, ordered: true },
    event: { reliable: true, ordered: true },
  },
  tickRate: 5,

  onJoin(player, ctx) {
    const existing = ctx.state.players[player.id];
    if (existing) {
      // Rejoin: keep their score, mark present again.
      existing.present = true;
    } else {
      ctx.state.players[player.id] = { name: 'Player', score: 0, present: true };
    }
  },

  onLeave(player, ctx) {
    const rec = ctx.state.players[player.id];
    if (rec) rec.present = false;
  },

  onMessage(player, msg, ctx) {
    const s = ctx.state;
    switch (msg.kind) {
      case 'setName': {
        const rec = s.players[player.id];
        if (rec && typeof msg.name === 'string') {
          rec.name = msg.name.slice(0, 24).trim() || 'Player';
        }
        return;
      }

      case 'start': {
        if (!isHost(player.id, ctx)) return;
        if (s.phase !== 'lobby') return;
        Object.assign(s, startMatch(s));
        return;
      }

      case 'guess': {
        if (s.phase !== 'round') return;
        if (typeof msg.value !== 'number') return;
        if (!s.guesses) s.guesses = {};
        s.guesses[player.id] = clampGuess(msg.value);
        return;
      }

      default:
        return;
    }
  },

  onTick(ctx) {
    const s = ctx.state;
    s.tick += 1;

    if (s.phase === 'lobby' || s.phase === 'over') return;

    if (deadlineReached(s)) {
      const next = advance(s);
      Object.assign(s, next);
      if (next.phase === 'over') {
        publishScores(ctx);
      }
    }
  },
});
