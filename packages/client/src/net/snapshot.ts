/**
 * Estado recebido da sala para o modelo que as views entendem.
 *
 * O schema do Colyseus e so transporte: aqui ele vira MatchState de shared,
 * e o render nunca le o schema direto. Campos que so o servidor usa (pavio,
 * RNG, dono da bomba) chegam neutros porque o cliente nao decide regra.
 */
import {
  ARENA_COLS,
  ARENA_ROWS,
  type Facing,
  type MatchPhase,
  type MatchState,
  type PowerUpKind,
} from "@pixelboom/shared";

/** Fase so do transporte: sala esperando jogadores. */
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
}

/** Forma do estado da sala vista pelo cliente, sem depender das classes do servidor. */
export interface RemoteState {
  phase: string;
  tick: number;
  elapsed: number;
  winnerId: string;
  connected: number;
  cells: Iterable<number>;
  players: { forEach(cb: (p: RemotePlayer) => void): void };
  bombs: Iterable<{ id: number; x: number; y: number }>;
  explosions: Iterable<{ id: number; cells: Iterable<number> }>;
  powerUps: Iterable<{ kind: number; x: number; y: number }>;
}

export type Snapshot =
  | { readonly kind: "waiting"; readonly connected: number }
  | { readonly kind: "match"; readonly state: MatchState };

export function readSnapshot(remote: RemoteState): Snapshot {
  if (remote.phase === WAITING_PHASE) {
    return { kind: "waiting", connected: remote.connected };
  }

  const players: MatchState["players"] = [];
  remote.players.forEach((p) => {
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
      roundsWon: 0,
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
  return { kind: "match", state };
}
