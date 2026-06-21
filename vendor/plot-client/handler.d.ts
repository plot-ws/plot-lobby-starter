import { Channel, Profile, PeriodOverride, LeaderboardEntry } from './protocol';

/**
 * Read-only view of the world at a past timestamp.
 *
 * Returned to a handler's `ctx.rewindTo` callback. Side-effect APIs
 * (broadcast, sendTo, kick, persistence, timers) are intentionally
 * absent — observing the past must not produce side effects. The
 * handler's `cb` returns a verdict; the handler then applies
 * consequences against the live `ctx.state` after the rewind closes.
 */
interface RewoundContext<S> {
    readonly state: S;
    readonly players: readonly Player[];
}

type Player = {
    id: string;
    joinedAt: number;
};
interface ProfileApi {
    get(playerId: string): Promise<Profile | null>;
    update(playerId: string, patch: Partial<Profile>): Promise<Profile>;
}
interface LeaderboardHandle {
    submit(playerId: string, score: number, period?: PeriodOverride): Promise<void>;
    top(n: number, period?: PeriodOverride): Promise<LeaderboardEntry[]>;
    around(playerId: string, k: number, period?: PeriodOverride): Promise<LeaderboardEntry[]>;
}
interface SaveApi {
    get(playerId: string, slot: string): Promise<unknown | null>;
    put(playerId: string, slot: string, value: unknown): Promise<void>;
    delete(playerId: string, slot: string): Promise<void>;
    list(playerId: string): Promise<string[]>;
}
interface ReplayApi {
    enabled(): boolean;
    append(event: {
        kind: string;
        data: unknown;
    }): void;
}
interface HandlerContext<S> {
    state: S;
    roomCode: string;
    appId: string;
    region: string;
    players: Player[];
    firstPlayer: Player | undefined;
    broadcast<T = unknown>(channel: Channel, data: T): void;
    sendTo<T = unknown>(playerId: string, channel: Channel, data: T): void;
    kick(playerId: string, reason?: string): void;
    log(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    setTimeout(cb: () => void, ms: number): number;
    clearTimeout(id: number): void;
    /**
     * Schedule a durable timer. Returns an id you can pass to
     * `cancelTimer`. When `delayMs` elapses the room's `onTimer(payload,
     * ctx)` fires (backed by a Durable Object alarm). Unlike `setTimeout`,
     * the payload is serialized and survives across RPCs.
     */
    scheduleTimer(payload: unknown, delayMs: number): string;
    /** Cancel a timer previously returned by `scheduleTimer`. */
    cancelTimer(id: string): void;
    profile: ProfileApi;
    leaderboard: (name: string) => LeaderboardHandle;
    save: SaveApi;
    replay: ReplayApi;
    /**
     * Run `cb` against the world state at `targetTs` (clamped to the
     * server's 500ms rewind horizon). Use this to validate hits or other
     * latency-sensitive interactions against the world the shooter
     * actually saw. The cb is synchronous and gets a read-only
     * RewoundContext; apply consequences against this (live) ctx after.
     */
    rewindTo<T>(targetTs: number, cb: (past: RewoundContext<S>) => T): Promise<T>;
}

declare class HandlerReject extends Error {
    code: string;
    constructor(code: string, message: string);
}

type PersistenceOp = 'read' | 'write';
type PersistenceStore = 'd1' | 'r2' | 'kv';
declare class PersistenceError extends Error {
    op: PersistenceOp;
    store: PersistenceStore;
    constructor(op: PersistenceOp, store: PersistenceStore, message: string);
}

type ChannelConfig = {
    reliable: boolean;
    ordered: boolean;
    rateLimit?: {
        perPlayer: number;
        perSeconds: number;
    };
};
type ChannelsConfig = Partial<Record<Channel, ChannelConfig>>;
interface RoomDefinition<S, M = unknown> {
    initialState: S;
    channels?: ChannelsConfig;
    tickRate?: 0 | 1 | 5 | 10 | 20 | 30;
    onCreate?: (ctx: HandlerContext<S>) => void | Promise<void>;
    onJoin?: (player: Player, ctx: HandlerContext<S>) => void | Promise<void>;
    onMessage?: (player: Player, msg: M, ctx: HandlerContext<S>) => void | Promise<void>;
    onTick?: (ctx: HandlerContext<S>) => void | Promise<void>;
    onLeave?: (player: Player, ctx: HandlerContext<S>) => void | Promise<void>;
    /**
     * Fired when a timer scheduled via `ctx.scheduleTimer(payload, delayMs)`
     * comes due. Backed by a Durable Object alarm, so it survives across
     * RPCs (unlike a `ctx.setTimeout` closure, which cannot cross the
     * Workers-for-Platforms isolate boundary).
     */
    onTimer?: (payload: unknown, ctx: HandlerContext<S>) => void | Promise<void>;
}
declare function defineRoom<S, M = unknown>(def: RoomDefinition<S, M>): RoomDefinition<S, M>;

export { type ChannelConfig, type ChannelsConfig, type HandlerContext, HandlerReject, type LeaderboardHandle, PersistenceError, type Player, type ProfileApi, type ReplayApi, type RewoundContext, type RoomDefinition, type SaveApi, defineRoom };
