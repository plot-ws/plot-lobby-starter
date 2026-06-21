declare const CHANNELS: readonly ["state", "event", "chat", "unreliable"];
type Channel = (typeof CHANNELS)[number];
declare function isChannel(x: unknown): x is Channel;
declare const DEFAULT_CHANNEL: Channel;

type ConnectRequest = {
    appKey: string;
    playerId: string;
    token?: string;
};
type ConnectResponse = {
    token: string;
    expiresAt: number;
    wsUrl: string;
};
type ServerEnvelope = {
    type: 'join';
    playerId: string;
    players: string[];
    ts: number;
} | {
    type: 'leave';
    playerId: string;
    players: string[];
    ts: number;
} | {
    type: 'message';
    from: string;
    channel: Channel;
    data: unknown;
    ts: number;
} | {
    type: 'state-snapshot';
    state: unknown;
    ts: number;
    lastAckedSeq?: number;
} | {
    type: 'state-patch';
    patch: unknown;
    ts: number;
    lastAckedSeq?: number;
} | {
    type: 'reconnect-token';
    token: string;
    expiresAt: number;
} | {
    type: 'error';
    code: string;
    message: string;
};
type ClientEnvelope = {
    type: 'message';
    channel?: Channel;
    data: unknown;
    _seq?: number;
    clientTs?: number;
};

type PlayerJWTClaims = {
    sub: string;
    app: string;
    exp: number;
    iat: number;
};

type MatchMode = 'quick' | 'ranked' | 'code' | 'lobby';
type MatchmakeRequest = {
    mode: MatchMode;
    maxPlayers?: number;
    attrs?: Record<string, string | number>;
    rank?: number;
    roomCode?: string;
};
type MatchmakeResponse = {
    roomCode: string;
    token: string;
    wsUrl: string;
};
type OpenRoomEntry = {
    roomCode: string;
    attrs: Record<string, string | number>;
    rank?: number;
    capacity: number;
    maxPlayers: number;
    version: string;
    publishedAt: number;
};

type Profile = {
    playerId: string;
    displayName: string | null;
    avatarUrl: string | null;
    metadata: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
};
type LeaderboardEntry = {
    playerId: string;
    score: number;
    rank: number;
    updatedAt: number;
};
type PeriodOverride = 'daily' | 'weekly' | 'monthly' | 'alltime';

declare const SCHEMA_VERSION = "v1b.0";
declare const HANDSHAKE_HEADER = "X-Plot-Protocol";

export { CHANNELS, type Channel, type ClientEnvelope, type ConnectRequest, type ConnectResponse, DEFAULT_CHANNEL, HANDSHAKE_HEADER, type LeaderboardEntry, type MatchMode, type MatchmakeRequest, type MatchmakeResponse, type OpenRoomEntry, type PeriodOverride, type PlayerJWTClaims, type Profile, SCHEMA_VERSION, type ServerEnvelope, isChannel };
