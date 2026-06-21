import { describe, expect, it } from 'vitest';
import {
  INTERMISSION_SECONDS,
  MAX_GUESS,
  MAX_ROUNDS,
  MIN_GUESS,
  ROUND_POINTS,
  ROUND_SECONDS,
  TICKS_PER_SECOND,
  advance,
  clampGuess,
  closestPlayer,
  deadlineReached,
  pickTarget,
  ranking,
  startMatch,
  type State,
} from './logic';

function baseState(over: Partial<State> = {}): State {
  return {
    phase: 'lobby',
    tick: 0,
    round: 0,
    maxRounds: MAX_ROUNDS,
    players: {
      a: { name: 'Ann', score: 0, present: true },
      b: { name: 'Bob', score: 0, present: true },
      c: { name: 'Cleo', score: 0, present: true },
    },
    ...over,
  };
}

describe('pickTarget', () => {
  it('is deterministic for a given round', () => {
    expect(pickTarget(0)).toBe(pickTarget(0));
    expect(pickTarget(5)).toBe(pickTarget(5));
  });

  it('stays within [MIN_GUESS, MAX_GUESS] across many rounds', () => {
    for (let r = 0; r < 500; r++) {
      const t = pickTarget(r);
      expect(t).toBeGreaterThanOrEqual(MIN_GUESS);
      expect(t).toBeLessThanOrEqual(MAX_GUESS);
      expect(Number.isInteger(t)).toBe(true);
    }
  });

  it('matches the documented seed formula', () => {
    // ((round*37+13) % 100) + 1
    expect(pickTarget(0)).toBe(14);
    expect(pickTarget(1)).toBe(51);
  });
});

describe('clampGuess', () => {
  it('clamps and floors into range', () => {
    expect(clampGuess(0)).toBe(MIN_GUESS);
    expect(clampGuess(999)).toBe(MAX_GUESS);
    expect(clampGuess(42.9)).toBe(42);
    expect(clampGuess(Number.NaN)).toBe(MIN_GUESS);
  });
});

describe('closestPlayer', () => {
  it('returns null with no guesses', () => {
    expect(closestPlayer(50, undefined)).toBeNull();
    expect(closestPlayer(50, {})).toBeNull();
  });

  it('picks the nearest guess', () => {
    expect(closestPlayer(50, { a: 40, b: 48, c: 90 })).toBe('b');
  });

  it('breaks ties toward the smallest id', () => {
    // target 50: z guesses 45 (dist 5), a guesses 55 (dist 5) -> smallest id 'a'.
    expect(closestPlayer(50, { z: 45, a: 55 })).toBe('a');
    // Insertion order must not matter.
    expect(closestPlayer(50, { a: 55, z: 45 })).toBe('a');
  });
});

describe('deadlineReached', () => {
  it('is false without a deadline and true at/after it', () => {
    expect(deadlineReached(baseState())).toBe(false);
    expect(deadlineReached(baseState({ tick: 10, deadlineTick: 11 }))).toBe(false);
    expect(deadlineReached(baseState({ tick: 11, deadlineTick: 11 }))).toBe(true);
  });
});

describe('startMatch', () => {
  it('seeds round 0 with its target and a round deadline', () => {
    const patch = startMatch(baseState({ tick: 10 }));
    expect(patch.phase).toBe('round');
    expect(patch.round).toBe(0);
    expect(patch.target).toBe(pickTarget(0));
    expect(patch.guesses).toEqual({});
    expect(patch.deadlineTick).toBe(10 + ROUND_SECONDS * TICKS_PER_SECOND);
  });
});

describe('advance', () => {
  it('round -> intermission scores the closest guesser', () => {
    const target = pickTarget(0);
    let s = baseState({
      phase: 'round',
      tick: 75,
      deadlineTick: 75,
      target,
      guesses: { a: target, b: target - 30, c: target + 50 },
    });
    s = advance(s);
    expect(s.phase).toBe('intermission');
    expect(s.players.a?.score).toBe(ROUND_POINTS);
    expect(s.players.b?.score).toBe(0);
    expect(s.deadlineTick).toBe(75 + INTERMISSION_SECONDS * TICKS_PER_SECOND);
  });

  it('intermission -> next round, then over after maxRounds', () => {
    // Round 0 intermission -> round 1.
    let s = baseState({ phase: 'intermission', round: 0, tick: 200, deadlineTick: 200 });
    s = advance(s);
    expect(s.phase).toBe('round');
    expect(s.round).toBe(1);
    expect(s.target).toBe(pickTarget(1));
    expect(s.guesses).toEqual({});

    // Round 1 intermission -> round 2.
    s = { ...s, phase: 'intermission', deadlineTick: s.tick };
    s = advance(s);
    expect(s.phase).toBe('round');
    expect(s.round).toBe(2);

    // Round 2 (last) intermission -> over.
    s = { ...s, phase: 'intermission', deadlineTick: s.tick };
    s = advance(s);
    expect(s.phase).toBe('over');
    expect(s.deadlineTick).toBeUndefined();
  });

  it('does not mutate the input state (pure)', () => {
    const target = pickTarget(0);
    const s = baseState({ phase: 'round', tick: 5, deadlineTick: 5, target, guesses: { a: 1 } });
    const snapshot = JSON.stringify(s);
    advance(s);
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('drives a full match from start to over, awarding the closest each round', () => {
    let s: State = baseState({ tick: 0 });
    s = { ...s, ...startMatch(s) };
    let guard = 0;
    while (s.phase !== 'over' && guard < 50) {
      if (s.phase === 'round') {
        // Ann nails every target -> she should win the match.
        s = { ...s, guesses: { a: s.target ?? 0, b: 1, c: 100 } };
      }
      s = { ...s, tick: s.deadlineTick ?? s.tick };
      s = advance(s);
      guard++;
    }
    expect(s.phase).toBe('over');
    expect(s.players.a?.score).toBe(MAX_ROUNDS * ROUND_POINTS);
    expect(ranking(s.players)[0]?.id).toBe('a');
  });
});
