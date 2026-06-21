import { CorrectionType } from './handler-client';
export { CorrectionType } from './handler-client';
import { RoomDefinition } from './handler';
import { ClientEnvelope, ServerEnvelope, Channel, Profile, LeaderboardEntry, MatchMode } from './protocol';
export * from './protocol';
export { CHANNELS, DEFAULT_CHANNEL, isChannel } from './protocol';

type Snapshot = {
    ts: number;
    state: unknown;
};
type Pair = {
    a: Snapshot;
    b: Snapshot | null;
} | null;
declare class SnapshotBuffer {
    private horizonMs;
    private snapshots;
    constructor(horizonMs: number);
    push(ts: number, state: unknown): void;
    lookup(targetTs: number): Pair;
    get size(): number;
    get oldest(): Snapshot | null;
    get newest(): Snapshot | null;
}

type InterpType = 'number' | 'vec2' | 'vec3' | 'quat';
type InterpolateOpts = {
    path: string;
    type: InterpType;
    renderDelay?: number;
};

/**
 * A non-wildcard sample resolves to a single interpolated value (or null when
 * the path is absent). A wildcard sample resolves to a map keyed by the
 * resolved leaf path. Both collapse to `null` when the requested server
 * timestamp falls outside the buffer's retained horizon.
 */
type SampleResult = unknown | Record<string, unknown> | null;
/**
 * A lightweight handle bound to a fixed past server timestamp. Lets callers
 * read several paths at one frozen time without repeating the timestamp.
 * Thin wrapper over {@link sampleAt} — purely a read view over the buffer.
 */
declare class Sampler {
    private buffer;
    readonly atServerTs: number;
    constructor(buffer: SnapshotBuffer, atServerTs: number);
    sample(path: string, type: InterpType): SampleResult;
}

interface Transport {
    send(env: ClientEnvelope): void;
    close(): void;
    onMessage(handler: (env: ServerEnvelope) => void): void;
    onClose(handler: () => void): void;
}

type RoomMessageEvent = {
    from: string;
    data: unknown;
};
type PresenceEvent = {
    playerId: string;
    players: string[];
};
type FrameEvent = {
    interpolated: Record<string, unknown>;
    ts: number;
};
type PredictedEvent = {
    state: unknown;
    ts: number;
    drift: number;
};
type PredictOpts = {
    path: string;
    type: CorrectionType;
    correctionMs?: number;
};
interface RoomEvents {
    message: (e: RoomMessageEvent) => void;
    join: (e: PresenceEvent) => void;
    leave: (e: PresenceEvent) => void;
    frame: (e: FrameEvent) => void;
    predicted: (e: PredictedEvent) => void;
}
interface SendOptions {
    channel?: Channel;
    clientTs?: number;
}
declare class Room {
    private _playerId;
    private transport;
    private listeners;
    currentState: unknown;
    private snapshotSink;
    private buffer;
    private clock;
    private interpolators;
    private frameTimer;
    private adaptive;
    private predictor;
    private nextSeq;
    private lastAckedSeq;
    private lastDrift;
    private predictedTracks;
    correctedState: Record<string, unknown>;
    constructor(_playerId: string, transport: Transport);
    /** Internal: register a sink that receives every applied (ts, state). */
    _onSnapshot(sink: (ts: number, state: unknown) => void): void;
    on<K extends keyof RoomEvents>(type: K, handler: RoomEvents[K]): void;
    send(data: unknown, opts?: SendOptions): void;
    leave(): void;
    attachHandler<S, M = unknown>(room: RoomDefinition<S, M>): void;
    get predictedState(): unknown;
    sendPredicted(input: unknown, opts?: SendOptions): void;
    predict(opts: PredictOpts): void;
    interpolate(opts: InterpolateOpts): void;
    /**
     * Sample the interpolated value at a single path at an arbitrary past
     * server timestamp — the client-side analogue of the server's
     * `ctx.rewindTo`. Reuses the same SnapshotBuffer + lerp + wildcard path
     * resolver the live frame loop uses, but is a pure read: it does not touch
     * the frame loop or any prediction/correction state.
     *
     * `atServerTs` is in the server time domain (same as snapshot `ts`); convert
     * a client wall-clock time with `clientTs - serverClockOffset`. Returns the
     * interpolated leaf value for a plain path, a `Record<string, unknown>`
     * keyed by resolved path for a `*` wildcard, or `null` when `atServerTs`
     * falls outside the buffer's retained horizon.
     */
    sampleAt(path: string, type: InterpType, atServerTs: number): SampleResult;
    /**
     * Bind a {@link Sampler} to a fixed past server timestamp so callers can
     * read several paths at one frozen time ergonomically (e.g. hit detection
     * across multiple entities at a shot's server time). Thin wrapper over the
     * same buffer lookup + lerp as {@link sampleAt}.
     */
    rewindTo(atServerTs: number): Sampler;
    /** Current median client→server clock offset (clientNow − serverTs). */
    get serverClockOffset(): number;
    /**
     * Adaptive smoothing: when enabled, the interpolation render delay grows
     * with measured connection jitter so a bursty link buffers more (fewer
     * gaps) and a steady link stays responsive. Effective extra delay =
     * clamp(gain * ServerClock.jitter, 0, maxExtraMs), added on top of each
     * interpolator's base renderDelay. Defaults: gain 1.5, maxExtraMs 200.
     */
    setAdaptiveSmoothing(opts: {
        enabled: boolean;
        gain?: number;
        maxExtraMs?: number;
    }): void;
    /** Current adaptive extra delay (ms) given the live jitter estimate. */
    adaptiveExtraDelay(): number;
    tickFrame(now?: number): void;
    startFrameLoop(intervalMs?: number): void;
    stopFrameLoop(): void;
    private dispatch;
}

declare class ProfileClient {
    private apiUrl;
    private tokenGetter;
    constructor(apiUrl: string, tokenGetter: () => string);
    me(): Promise<Profile>;
}

declare class LeaderboardClient {
    private apiUrl;
    private name;
    private tokenGetter;
    constructor(apiUrl: string, name: string, tokenGetter: () => string);
    top(n?: number, period?: string): Promise<LeaderboardEntry[]>;
    around(k?: number, period?: string): Promise<LeaderboardEntry[]>;
}

declare class SaveClient {
    private apiUrl;
    private tokenGetter;
    constructor(apiUrl: string, tokenGetter: () => string);
    slots(): Promise<string[]>;
    get<T = unknown>(slot: string): Promise<T | null>;
}

interface PlotOptions {
    appKey: string;
    playerId: string;
    apiUrl?: string;
}
interface JoinOptions {
    mode?: MatchMode;
    roomCode?: string;
    maxPlayers?: number;
    attrs?: Record<string, string | number>;
    rank?: number;
}
declare class Plot {
    private options;
    private currentToken;
    profile: ProfileClient;
    save: SaveClient;
    leaderboard: (name: string) => LeaderboardClient;
    constructor(options: PlotOptions);
    private getToken;
    private wirePersistence;
    connect(): Promise<void>;
    join(opts: JoinOptions): Promise<Room>;
}

type Vec2 = {
    x: number;
    y: number;
};

type Vec3 = {
    x: number;
    y: number;
    z: number;
};

type Quat = {
    x: number;
    y: number;
    z: number;
    w: number;
};

export { type FrameEvent, type InterpType, type InterpolateOpts, Plot, type PredictOpts, type PredictedEvent, type Quat, Room, type Vec2, type Vec3 };
