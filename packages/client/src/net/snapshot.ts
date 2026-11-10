/**
 * Converte o estado recebido da sala em MatchState para as views. Campos
 * usados so pela simulacao do servidor (pavio, RNG, dono da bomba) chegam
 * com valores neutros.
 */
import {
  ARENA_COLS,
  ARENA_ROWS,
  type Facing,
  type MatchPhase,
  type MatchState,
  type PowerUpKind,
} from "@pixelboom/shared";

/** Fase de transporte: sala aguardando jogadores. */
const WAITING_PHASE = "waiting";

interface RemotePlayer {
  id: string;
  slot: number;
  x: number;
  y: number;
  facing: string;
  alive: boolean;
  speed: number;
  maxBombs: number;
  range: number;
  roundsWon: number;
  ackSeq: number;
}

/** Formato do estado da sala, independente das classes de schema do servidor. */
export interface RemoteState {
  phase: string;
  tick: number;
  elapsed: number;
  winnerId: string;
  connected: number;
  round: number;
  seriesFinished: boolean;
  seriesWinnerId: string;
  cells: Iterable<number>;
  players: { forEach(cb: (p: RemotePlayer) => void): void };
  bombs: Iterable<{ id: number; x: number; y: number }>;
  explosions: Iterable<{ id: number; cells: Iterable<number> }>;
  powerUps: Iterable<{ kind: number; x: number; y: number }>;
}

export interface SeriesView {
  readonly round: number;
  readonly finished: boolean;
  readonly winnerId: string | null;
}

export interface MatchSnapshot {
  readonly kind: "match";
  readonly state: MatchState;
  readonly series: SeriesView;
  /** Ultima entrada confirmada pelo servidor, por jogador. */
  readonly acks: ReadonlyMap<string, number>;
}

export type Snapshot = { readonly kind: "waiting"; readonly connected: number } | MatchSnapshot;

export function readSnapshot(remote: RemoteState): Snapshot {
  if (remote.phase === WAITING_PHASE) {
    return { kind: "waiting", connected: remote.connected };
  }

  const players: MatchState["players"] = [];
  const acks = new Map<string, number>();
  remote.players.forEach((p) => {
    acks.set(p.id, p.ackSeq);
    players.push({
      id: p.id,
      slot: p.slot,
      x: p.x,
      y: p.y,
      facing: p.facing as Facing,
      alive: p.alive,
      speed: p.speed,
      maxBombs: p.maxBombs,
      range: p.range,
      bombsPlaced: 0,
      roundsWon: p.roundsWon,
    });
  });
  players.sort((a, b) => a.slot - b.slot);

  const state: MatchState = {
    tick: remote.tick,
    elapsed: remote.elapsed,
    phase: remote.phase as MatchPhase,
    grid: { cols: ARENA_COLS, rows: ARENA_ROWS, cells: Uint8Array.from(remote.cells) },
    players,
    bombs: [...remote.bombs].map((b) => ({
      id: b.id,
      ownerId: "",
      x: b.x,
      y: b.y,
      range: 0,
      fuseRemaining: 0,
    })),
    explosions: [...remote.explosions].map((e) => ({
      id: e.id,
      ownerId: "",
      cells: [...e.cells],
      remaining: 0,
    })),
    powerUps: [...remote.powerUps].map((p) => ({ kind: p.kind as PowerUpKind, x: p.x, y: p.y })),
    ringsClosed: 0,
    winnerId: remote.winnerId === "" ? null : remote.winnerId,
    nextEntityId: 0,
    rng: 0,
  };
  const series: SeriesView = {
    round: remote.round,
    finished: remote.seriesFinished,
    winnerId: remote.seriesWinnerId === "" ? null : remote.seriesWinnerId,
  };
  return { kind: "match", state, series, acks };
}
