/**
 * Pure lobby/rounds/scoreboard engine for the Plot lobby starter.
 *
 * Everything here is a pure function of state — no I/O, no wall-clock, no Plot
 * APIs — so the rules are deterministically unit-testable and run identically
 * on the authoritative server handler and (where useful) the client.
 *
 * The one bundled round type is "closest guess": each round derives a secret
 * target number 1..100 from the round index, every player submits a guess, and
 * at the deadline the closest guess wins the round's points. Swap this single
 * round for drawing / trivia / take-turns moves to build your own game — the
 * lobby → round → intermission → over machine stays the same.
 *
 * Timing is expressed in *ticks*, not milliseconds. The handler runs at
 * tickRate 5 (5 ticks/sec), increments `state.tick` each tick, and parks
 * deadlines in `state.deadlineTick`. `advance` is the single pure reducer that
 * decides what happens when a deadline expires.
 */

/** Server tick rate (ticks per second). 5 ticks ~= 1 second. */
export const TICKS_PER_SECOND = 5;

/** Seconds a guessing round / intermission window lasts. */
export const ROUND_SECONDS = 15;
export const INTERMISSION_SECONDS = 5;

/** Total rounds in a match. */
export const MAX_ROUNDS = 3;

/** Points awarded to the round winner (closest guess). */
export const ROUND_POINTS = 100;

/** Lowest / highest guessable (and target) number, inclusive. */
export const MIN_GUESS = 1;
export const MAX_GUESS = 100;

/** Phases of the engine. */
export type Phase = 'lobby' | 'round' | 'intermission' | 'over';

/** Per-player record. Score persists across presence changes. */
export type PlayerRec = {
  name: string;
  score: number;
  present: boolean;
};

/** Full authoritative room state (snapshotted to clients each tick). */
export type State = {
  phase: Phase;
  tick: number;
  round: number;
  maxRounds: number;
  players: Record<string, PlayerRec>;
  /** Tick at which the current timed phase ends. */
  deadlineTick?: number;
  /** The secret target for the active (or just-scored) round. */
  target?: number;
  /** playerId -> guess (1..100) for the active round. */
  guesses?: Record<string, number>;
};

/** Clamp a number into the inclusive guess range, flooring to an integer. */
export function clampGuess(n: number): number {
  if (!Number.isFinite(n)) return MIN_GUESS;
  return Math.min(MAX_GUESS, Math.max(MIN_GUESS, Math.floor(n)));
}

/**
 * Derive the secret target for a (0-based) round deterministically. Pure and
 * seedable from the round index alone, so server and client agree and tests are
 * reproducible. Always within [MIN_GUESS, MAX_GUESS].
 */
export function pickTarget(round: number): number {
  const r = Math.floor(Math.abs(round));
  return ((r * 37 + 13) % MAX_GUESS) + MIN_GUESS;
}

/**
 * Given a target and a map of playerId -> guess, return the id of the player
 * whose guess is closest to the target, or null when there are no guesses.
 * Ties (equal absolute distance) break deterministically toward the smallest id
 * (string compare) so results are reproducible.
 */
export function closestPlayer(
  target: number,
  guesses: Record<string, number> | undefined,
): string | null {
  if (!guesses) return null;
  let best: string | null = null;
  let bestDist = Infinity;
  for (const id of Object.keys(guesses).sort()) {
    const guess = guesses[id];
    if (guess === undefined) continue;
    const dist = Math.abs(guess - target);
    if (dist < bestDist) {
      best = id;
      bestDist = dist;
    }
  }
  return best;
}

/** Whether the current timed phase has hit its deadline at the given tick. */
export function deadlineReached(state: State): boolean {
  if (state.deadlineTick === undefined) return false;
  return state.tick >= state.deadlineTick;
}

/** Deep-copy the players map so reducers stay pure. */
function clonePlayers(players: Record<string, PlayerRec>): Record<string, PlayerRec> {
  const out: Record<string, PlayerRec> = {};
  for (const [id, rec] of Object.entries(players)) {
    out[id] = { ...rec };
  }
  return out;
}

/**
 * Initialize the first round when leaving the lobby. Returns the fields to
 * merge onto state (the caller owns committing them, e.g. `Object.assign`).
 */
export function startMatch(state: State): Partial<State> {
  return {
    phase: 'round',
    round: 0,
    target: pickTarget(0),
    guesses: {},
    deadlineTick: state.tick + ROUND_SECONDS * TICKS_PER_SECOND,
  };
}

/**
 * The single pure transition reducer. Given a state whose current timed phase
 * has reached (or passed) its deadline, return the next state.
 *
 * Pure: it mutates only a deep-enough copy it owns and returns it, so callers
 * use it functionally — `state = advance(state)`. It never reads the clock; all
 * timing is driven by `state.tick` vs `state.deadlineTick`.
 *
 * Transitions:
 *  - round        -> intermission (score the closest guesser)
 *  - intermission -> next round, or 'over' after maxRounds
 *  - lobby / over -> unchanged
 */
export function advance(state: State): State {
  const next: State = {
    ...state,
    players: clonePlayers(state.players),
    guesses: state.guesses ? { ...state.guesses } : state.guesses,
  };

  switch (next.phase) {
    case 'round': {
      const winner = closestPlayer(next.target ?? pickTarget(next.round), next.guesses);
      if (winner !== null) {
        const rec = next.players[winner];
        if (rec) rec.score += ROUND_POINTS;
      }
      next.phase = 'intermission';
      next.deadlineTick = next.tick + INTERMISSION_SECONDS * TICKS_PER_SECOND;
      return next;
    }
    case 'intermission': {
      const nextRound = next.round + 1;
      if (nextRound >= next.maxRounds) {
        next.phase = 'over';
        next.deadlineTick = undefined;
        return next;
      }
      next.round = nextRound;
      next.phase = 'round';
      next.target = pickTarget(nextRound);
      next.guesses = {};
      next.deadlineTick = next.tick + ROUND_SECONDS * TICKS_PER_SECOND;
      return next;
    }
    default:
      return next;
  }
}

/** Players sorted by score desc (name asc tiebreak) for the scoreboard. */
export function ranking(players: Record<string, PlayerRec>): Array<{ id: string } & PlayerRec> {
  return Object.entries(players)
    .map(([id, rec]) => ({ id, ...rec }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
