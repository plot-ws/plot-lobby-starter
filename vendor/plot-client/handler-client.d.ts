import { Player, RoomDefinition } from './handler';

type RunHandlerCtx = {
    state: unknown;
    roomCode?: string;
    appId?: string;
    region?: string;
    players?: Player[];
};
type RunHandlerCall = {
    method: 'noop';
} | {
    method: 'onCreate';
} | {
    method: 'onJoin';
    args: {
        player: Player;
    };
} | {
    method: 'onMessage';
    args: {
        player: Player;
        msg: unknown;
    };
} | {
    method: 'onLeave';
    args: {
        player: Player;
    };
} | {
    method: 'onTick';
};
declare function runHandler<S, M = unknown>(room: RoomDefinition<S, M>, ctxInput: RunHandlerCtx, call: RunHandlerCall): S;

type QueueEntry = {
    seq: number;
    input: unknown;
};
declare class InputQueue {
    private entries;
    push(entry: QueueEntry): boolean;
    ackUpTo(seq: number): void;
    pending(): readonly QueueEntry[];
    get size(): number;
    clear(): void;
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
type Value = number | Vec2 | Vec3 | Quat;
type CorrectionType = 'number' | 'vec2' | 'vec3' | 'quat';
type CorrectionOpts = {
    type: CorrectionType;
    durationMs: number;
};
declare class CorrectionTrack {
    private opts;
    private value;
    private startedAt;
    private hasRecord;
    constructor(opts: CorrectionOpts);
    record(drift: Value, now: number): void;
    read(now: number): Value;
}

type PredictorOpts<S, M> = {
    room: RoomDefinition<S, M>;
    localPlayer: Player;
    roomCode?: string;
    appId?: string;
};
type ReconcileEvent = {
    drift: number;
};
declare class Predictor<S = unknown, M = unknown> {
    private opts;
    private _authoritative;
    private _predicted;
    private _queue;
    private _disabled;
    onReconcile: ((e: ReconcileEvent) => void) | null;
    constructor(opts: PredictorOpts<S, M>);
    setAuthoritative(state: S): void;
    get predictedState(): S;
    get queue(): InputQueue;
    get disabled(): boolean;
    apply(entry: QueueEntry): void;
    reconcile(serverState: S, lastAckedSeq: number): void;
    disable(): void;
}

export { type CorrectionOpts, CorrectionTrack, type CorrectionType, InputQueue, Predictor, type PredictorOpts, type QueueEntry, type ReconcileEvent, type RunHandlerCall, type RunHandlerCtx, runHandler };
